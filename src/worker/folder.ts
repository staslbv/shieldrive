
import * as FIELD from '../constant';
import * as gdrive from '../REST/gdrive';
import * as apishield from '../apishield';
import { ILoginInfo } from '../constant';
import { IGFile } from '../REST/gdrive';
import { IGContact } from '../REST/gdrive';
import { IShieldFolder } from '../apishield';
import { IShieldContact } from '../apishield';
import { IShieldPathPermissions } from '../apishield';
import { IShieldPathPermission } from '../apishield';
import { IProtectResult } from '../apishield';
import { IShieldoxIOProtectArgs } from '../apishield';
import { IContentBuffer } from '../constant';
import { IShieldColorResponse } from '../apishield';

import { IShieldFolderScopeRef } from '../apishield';
import { IShieldPolicyScopeInfo } from '../apishield';
import { IShieldPolicyScope } from '../apishield';
import { IShieldMemberCredentials } from '../apishield';

import { IFolderWorkerRequestResponse } from '../constant';
import { BackgndWorker } from './bkworker';
import { CRest } from '../REST/rest';

import {CDb} from '../DATABASE/db';

const _ = require('underscore');

const GDRIVE_FOLDER_MIME_TYPE: string = 'application/vnd.google-apps.folder';

//
const spawn = require('threads').spawn;




function cancelationPending(context: BackgndWorker): Promise<boolean>{
    return new Promise((resolve, reject) => {
        if (!context || typeof context == 'undefined') {
            resolve(false);
        } else {
            return context.loadJobObject()
                .then((e) => {
                    resolve(e.fcancelPending);
                })
                .catch(() => {
                    resolve(false);
                });
        }
    });
}

export class CGEntry {
    user: ILoginInfo;
    entryId: string;
    permissions: IGContact[];
    contacts: IGContact[];
    role: IGContact;
    canRW: boolean;
    flagOwner: boolean;

    get hasLoadedMetadata(): boolean {
        return (_.isObject(this.metadata) &&
            _.isString(this.metadata.id) &&
            _.isString(this.metadata.mimeType));
    }

    get isFolder(): boolean {
        return (this.metadata.mimeType == GDRIVE_FOLDER_MIME_TYPE);
    }
    //load metadata: parents, owners, title, mimeType, fileSize, modifiedDate
    private resolve_loadMetadata(): Promise<IGFile> {
        return new Promise((resolve, reject) => {
            if (typeof this.metadata == 'object') {
                resolve(this.metadata);
            } else {
                return gdrive.list_file_metadata(this.user, this.entryId)
                    .then((e) => resolve((this.metadata = e)))
                    .catch(() => reject());
            }
        });
    }
    private FLAG_CONTACTS_RESOLVED: boolean = false;
    // load contacts: emailAddress, role, name
    private resolve_loadPermissions(): Promise<IGContact[]> {
        return new Promise((resolve, reject) => {
            if (typeof this.permissions == 'object') {
                resolve(this.permissions);
            } else {
                return gdrive.rest_file_contacts(this.user, this.entryId)
                    .then((e) => { resolve((this.permissions = e)); })
                    .catch(() => reject());
            }
        });
    }
    // iterate object permissions 
    private resolve_identifyCallerPermissions(): Promise<IGContact> {
        return new Promise((resolve, reject) => {
            _.each(_.indexBy(this.permissions, 'emailAddress'), (value: IGContact, key: string) => {
                let mail: string = key.toLowerCase();
                if (this.user.account.user.email.toLocaleLowerCase() == mail ||
                    this.user.account.account.key.toLocaleLowerCase() == mail) {
                    this.role = value;
                } else {
                    this.contacts.push(value);
                }
            });
            resolve(this.role);
        });
    }
    // set canRW and flagOwner flags
    private resolve_callerPermissions(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.role) {
                resolve(false);
            } else {
                this.canRW = (this.role.role == 'owner' || this.role.role == 'writer');
                this.flagOwner = (this.role.role == 'owner');
                resolve(this.canRW);
            }
        });
    }

    // general load function. 
    public loadMetadata(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.metadata) {
                resolve(true);
            } else {
                return this.resolve_loadMetadata()
                    .then((e) => resolve(true))
                    .catch(() => {
                        console.log('ERROR: UNABLE TO RESOLVE OBJECT METADATA');
                        reject();});
            }
        });
    }
    public resolveRW(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return this.resolve_loadPermissions()
                .then((e) => { return this.resolve_identifyCallerPermissions(); })
                .then((e) => { return this.resolve_callerPermissions(); })
                .then((e) => resolve(this.canRW))
                .catch(() => reject());
        });
    }
    // sync all contacts to IShieldoxContact
    private syncAB(contacts: IGContact[]): Promise<IShieldContact[]> {
        return new Promise((resolve, reject) => {
            return Promise.all(contacts.map((contact) => {
                return apishield.syncContactPromiseResolve(this.user, contact.emailAddress, contact.name)
            })).then((e) => { // got IShieldContact
                resolve(e);
            });
        });
    }
    protected toShieldPolicyScope(contacts: IGContact[]): Promise<IShieldPolicyScope> {
        return new Promise((resolve, reject) => {
            return this.syncAB(contacts).then((e) => {
                const arr: any[] = [];
                e.forEach((contact) => {
                    if (contact.objectId != 'undefined') {
                        arr.push({
                            objectId: contact.objectId, enabled: true,
                            canedit: true // here call function to determine actual value 
                        });
                    }
                });
                const va: IShieldPolicyScope = {
                    groups: {},
                    contacts: _.indexBy(arr, 'objectId')
                };
                resolve(va);
            }).catch((code) => resolve(undefined));
        });
    }
    protected toShieldPolicyScopeInfo(contacts: IGContact[], fautoscope: boolean): Promise<IShieldPolicyScopeInfo> {
        return new Promise((resolve, reject) => {
            return this.toShieldPolicyScope(contacts).then((e) => {
                resolve({
                    fautoscope: fautoscope,
                    scope: e
                });
            }).catch(() => resolve(undefined));
        });
    }
    protected toShieldFolderScopeRef(contacts: IGContact[], fautoscope: boolean, objectId: string): Promise<IShieldFolderScopeRef> {
        return new Promise((resolve, reject) => {
            return this.toShieldPolicyScopeInfo(contacts, fautoscope)
                .then((e) => {
                    resolve({
                        objectId: objectId,
                        scope: e
                    });
                })
                .catch(() => resolve(undefined));
        });
    }
    constructor(user: ILoginInfo, id: string, public metadata: IGFile) {
        this.user = user;
        this.entryId = id;
        this.permissions = undefined;
        this.role = undefined;
        this.canRW = false;
        this.flagOwner = false;
        this.contacts = [];
    }
}

export class CGFolderSynk extends CGEntry {
    shieldObj: IShieldFolder;
    folders:   CGFolderSynk[];
    files:     CGFileSynk[];

    // synchronize current folder and get objectId
    syncFolder(): Promise<IShieldFolder> {
        return new Promise((resolve, reject) => {
            return apishield.syncFolder(this.user, this.metadata.id, this.metadata.title)
                .then((e) => resolve((this.shieldObj = e)))
                .catch(() => reject())
        });
    }

    promise_loadView_All(recursive: boolean): Promise<IShieldPathPermissions>{
        return new Promise((resolve,reject)=>{
            return this.promise_loadView(recursive)
            .then((e)=>resolve(e))
            .catch(()=>resolve(undefined));
        });
    }

    promise_loadView(recursive: boolean): Promise<IShieldPathPermissions> {
        return new Promise((resolve, reject) => {
            return this.loadMetadata() // got permissions and shared list
                .then((e) => {
                    return gdrive.list_objects_folder(this.user, this.entryId);
                })
                .then((e) => { // split it up and make sure all items are filled
                    _.each(_.groupBy(e, 'mimeType'), (e: IGFile[], type: string) => {
                        let flagFolder: boolean = (type == GDRIVE_FOLDER_MIME_TYPE);
                        e.forEach((e) => {
                            if (flagFolder) {
                                this.folders.push(new CGFolderSynk(this.user, e.id, e));
                            } else {
                                this.files.push(new CGFileSynk(this.user, e.id, e, this));
                            }
                        });
                    });
                    return this.promise_loadViewChildren(recursive);
                })
                .then((e) => { return this.promise_loadViewShieldPermissions(recursive); })
                .then((e) => resolve(e))
                .catch(() => reject());
        });
    }



    private promise_loadViewChildren(recursive: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return this.promise_loadViewChildren_Folders(recursive)
                .then(() => {
                    return this.promise_loadViewChildren_Files(recursive);
                })
                .then(() => resolve(true))
                .catch(() => reject());
        });
    }

    private promise_loadViewChildren_Files(recursive: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return Promise.all(this.files.map((file) => {
                return file.loadMetadata();
            })).then(() => {
                resolve(true);
            }).catch(() => reject());
        });
    }

    private promise_loadViewChildren_Folders(recursive: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return Promise.all(this.folders.map((folder) => {
                return folder.loadMetadata();
            })).then(() => {
                if (!recursive){
                    resolve(true);
                }else{
                    return Promise.all(this.folders.map((folder)=>{
                        return folder.promise_loadView_All(recursive);
                    })).then(()=>{
                        console.log('>>>>>>>>>>>>>>>>>>>>>>  RESOLVED RECURSIVE');
                        resolve(true);
                    });
                }
            }).catch(() => reject());
        });
    }

    private promise_loadViewShieldPermissions(recursive: boolean): Promise<IShieldPathPermissions> {
        return new Promise((resolve, reject) => { // refer to Shieldox API for details
            const pFolders: any[] = [];
            const pDocuments: any[] = [];
            // fill up array for getOptions call
            this.folders.forEach((folder) => pFolders.push({ cloudKey: folder.entryId }));
            this.files.forEach((file) => pDocuments.push({ cloudKey: file.entryId }));
            // call shieldox
            return apishield.options(this.user, {
                folders: pFolders,
                documents: pDocuments
            }).then((e) => { // fill up paths and menu options based on cloud permitions
                var a = e.documents.map((e) => { return _.pick(e, 'color', 'cloudKey'); });
                var b = e.folders.map((e) => { return _.pick(e, 'color', 'cloudKey'); });
                a.forEach((e) => {
                    this.files.forEach((file) => {
                        if (file.entryId == e.cloudKey) {
                            e.path = file.metadata.title;
                            e.hasmenu = file.canRW;
                        }
                    });
                });
                b.forEach((e) => {
                    this.folders.forEach((folder) => {
                        if (folder.entryId == e.cloudKey) {
                            e.path = folder.metadata.title;
                            e.hasmenu = folder.canRW;
                        }
                    });
                });
                resolve({
                    folders: b,
                    files: a
                });
            }).catch(() => reject());
        });
    }

    public colorUiLoad(): Promise<IShieldColorResponse> {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                    if (!this.canRW) {
                        reject(403);
                    } else {
                        return this.syncFolder();
                    }
                })
                .then((e) => { return this.calcUiOptions(); })
                .then((e) => { resolve(e); })
                .catch(() => reject(500));
        });

    }

    private calcUiOptions(): Promise<IShieldColorResponse> {
        return new Promise((resolve, reject) => {
            var args = {
                documents: [],
                folders: [{ cloudKey: this.entryId }]
            };
            return apishield.options(this.user, args)
                .then((e) => {
                    let colors = _.pick(e.folders[0], 'color', 'colors');
                    let response: IShieldColorResponse = {
                        cloudKey: this.entryId,
                        objectId: this.shieldObj.objectId,
                        color: colors.color,
                        colors: colors.colors
                    };
                    resolve(response);
                })
                .catch(() => reject(500));
        });
    }

    private updateSharedContacts(): Promise<IShieldFolder> {
        return new Promise((resolve, reject) => {
            return this.toShieldFolderScopeRef(this.contacts, false, this.shieldObj.objectId)
                .then((e) => {
                    return apishield.scopeFolder(this.user, e);
                })
                .then((e) => resolve(e))
                .catch((e) => reject(e));
        })
    }

    public protect(color: number): Promise<IShieldFolder> {
        return new Promise((resolve, reject) => {
            var context : BackgndWorker; 
            var cancelation_pending: boolean = false;
            return this.loadMetadata()
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                    if (!this.canRW) {
                        reject(403);
                    } else {
                        return this.syncFolder();
                    }
                })
                .then((e) => { return this.updateSharedContacts() })
                .then((e) => { return apishield.colorFolder(this.user, { color: color, objectId: this.shieldObj.objectId }); })
                .then((e) => {
                    const dirty: boolean = (this.shieldObj.color > 0 && e.color == 0) || (this.shieldObj.color == 0 && e.color > 0);
                    this.shieldObj = e;
                    e['dirty'] = dirty;
                    if (dirty) {
                         return (context = new BackgndWorker(CRest.pData, this.user, this.entryId, e.color)).getContext();
                    }else{
                         resolve(e);
                    }
                })
                .then((e)=>{
                    if (e.context.frunning){
                        console.log('>>>>>>>>>>>>>>>>>>>>>      CANCELING CURRENT SCAN');
                        return context.cancelScan(this.shieldObj.color > 0);
                    }else if (e.enable){
                        console.log('>>>>>>>>>>>>>>>>>>>>       BEGINNING NEW SCAN');
                        return context.beginScan();
                    }else{
                        console.log('>>>>>>>>>>>>>>>>>>>>       NO ACTION TAKEN');
                        resolve(e);
                    }
                })
                .then((e)=>{
                    if (!context.statusObj.fcancelPending){
                         this.batchSpawn(this.shieldObj, context);
                    }else{
                         console.log('>>>>>>>>>>>>>>>>>>>>       CANCELATION PENDING ...');
                    }
                    resolve(this.shieldObj);
                })
                .catch(() => reject(500));
        });
    }
     
    private batchSpawn(folder: IShieldFolder, context: BackgndWorker): void{
            const thread = spawn("worker//process.js");
            thread.send({ 
                user:     this.user,
                entryId:  this.entryId,
                metadata: this.metadata,
                folder:   folder,
                context:  context.statusObj
             })
            .on('message', function (response) {
                console.log('THREAD COMPLETED !');
                thread.kill();
            })
            .on('error', (error)=> {
                console.log('THREAD ERROR ! : ' + error);
            })
            .on('exit',  ()=> {
                console.log('THREAD EXIT !');
            });
    }
    
   
    public batchProtect(folder: IShieldFolder, context: BackgndWorker): Promise<boolean> {
        this.folders = [];
        this.files   = [];
        console.log('batchProtecting ....');
        return new Promise((resolve,reject)=>{
            return this.promise_loadView(false)
                .then((e) => {
                    return context.beginScan()
                        .then(() => {
                            Promise.all(this.files.map((item) => {
                                return item.protect_promise(folder.color, false, context);
                            })).then((e) => {
                                console.log('PROMISSES RESOLVED:' + e.length);
                                return cancelationPending(context).then((canceled) => {
                                    if (canceled) {
                                        return context.beginScan().then((e) => {
                                            return this.syncFolder().then((e) => {
                                                 resolve(this.batchProtect((this.shieldObj = e), context));
                                            }).catch((e) => {
                                                 reject();
                                            });
                                        });
                                    } else {
                                        return context.completeScan().then((e) => {
                                            console.log('>>>>>>>>>>>>>>>>>>>>>  --SCAN--COMPLETED--');
                                            resolve();
                                        });
                                    }
                                });
                            });
                        }).catch((BEGIN_SCAN_ERROR_CODE: number) => {
                            reject();
                        });
                }).catch((e) => {
                     reject();
                });
        });
    }

    


    constructor(user: ILoginInfo, entryId: string, metadata: IGFile) {
        super(user, entryId, metadata);
        this.shieldObj = undefined;
        this.folders = [];
        this.files = [];
    }
}

export class CGFileSynk extends CGEntry {
    parent: CGFolderSynk;
    privateContacts: IGContact[];
    contentBuffer: IContentBuffer;
    contentIoArgs: IShieldoxIOProtectArgs;


    private updateSharedContacts(): Promise<number> {
        return new Promise((resolve, reject) => {
            return this.toShieldPolicyScope(this.privateContacts)
                .then((e) => {
                    return apishield.scopeDocument(this.user, this.contentIoArgs.objectId, e);
                })
                .then((e)  => resolve(e))
                .catch((e) => reject(e));
        })
    }
 

    public protect_promise(color: number, force: boolean, context: BackgndWorker): Promise<IShieldoxIOProtectArgs> {
        return new Promise((resolve, reject) => {
            try {
              return this.protect(color, force, context)
                    .then((e) => resolve(e))
                    .catch(() => resolve(undefined));
            } catch (Error) {
                 console.log('ERROR: ' + Error);
                 resolve(undefined);
            } 
        });
    }

    public protect(color: number, force: boolean, context: BackgndWorker): Promise<IShieldoxIOProtectArgs> {
        return new Promise((resolve, reject) => {
            console.log('PROTECTING: ' + this.metadata.title);
            return this.loadIoDataAndGetStatus()
                .then((code) => { return cancelationPending(context); })
                .then((canceled)=>{
                    if ((canceled) ||  (this.parent.shieldObj.color > 0 && color == 0) || !this.canRW) {
                        console.log('PROTECT REJECTED: REASON #1');
                        reject(409); // can not unprotect file in folder or operation canceled...
                    } else {
                        this.contentIoArgs.color   = color;
                        this.contentIoArgs.protect = (force || color == 0 || this.parent.shieldObj.color == 0);

                        console.log('Calling lock ...');


                        return apishield.lock(this.user, this.contentIoArgs);
                    }
                })
                .then((e) => {
                    this.contentBuffer.data = e.data;
                    this.contentIoArgs = e;
                    return cancelationPending(context);})
                .then((canceled)=>{
                    if (canceled) {
                        console.log('PROTECT REJECTED: REASON #2');
                        reject(409);
                    } else {
                        if (!this.contentIoArgs.dirty) {
                            resolve(this.contentIoArgs);
                        } else {
                             console.log('Calling upload ...');
                            return gdrive.file_upload(this.user, this.metadata.id, this.contentBuffer);
                        }
                    }
                })
            //  .then((e) => { return this.updateSharedContacts() })
                .then((e) => {
                    console.log('PROTECT ACCEPTED, Notifieng: ' + this.metadata.title);
                    delete this.contentIoArgs.data;
                    delete this.contentIoArgs.protect;
                    resolve(this.contentIoArgs);
                })
                .catch((code: number) => {
                    console.log('PROTECT REJECTED: REASON#4 ' + this.metadata.title);
                    reject(code);
                });
        });
    }

    public colorUiLoad(): Promise<IShieldColorResponse> {
        return new Promise((resolve, reject) => {
            return this.loadIoDataAndGetStatus()
                .then((e) => {
                    if (!this.canRW) {
                        reject(403);
                    } else {
                        return apishield.lock(this.user, this.contentIoArgs);
                    }
                })
                .then((e) => {
                    this.contentBuffer.data = e.data;
                    this.contentIoArgs = e;
                    if (!_.isString(e.objectId) || e.objectId.length == 0) {
                        reject(415);
                    } else {
                        return this.calcUiOptions();
                    }
                })
                .then((e) => {
                    resolve(e);
                })
                .catch((code) => reject(code));
        });
    }

    private calcUiOptions(): Promise<IShieldColorResponse> {
        return new Promise((resolve, reject) => {
            var args = {
                folders: [],
                documents: [{ cloudKey: this.entryId }]
            };
            return apishield.options(this.user, args)
                .then((e) => {
                    let colors = _.pick(e.documents[0], 'color', 'colors');
                    let response: IShieldColorResponse = {
                        cloudKey: this.entryId,
                        objectId: this.contentIoArgs.objectId,
                        color: colors.color,
                        colors: colors.colors
                    };
                    resolve(response);
                })
                .catch(() => reject(500));
        });
    }

    // load metadata of parent and child, determine if caller has acceess,download file,sync folder and fill IO args
    private loadIoDataAndGetStatus(): Promise<number> {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.loadObjectWithContacts(); })
                .then((e) => {
                    if (typeof this.role == 'undefined') {
                        console.log('REJECTED loadIoDataAndGetStatus:  ROLE IS NULL');
                        reject(401);
                    } else {
                        return gdrive.file_download(this.user, this.metadata.id);
                    }
                })
                .then((e) => {
                    this.contentBuffer = e;
                    return this.parent.syncFolder();
                })
                .then((e) => {
                    this.contentIoArgs = this.getIoArgs(this.parent.shieldObj.objectId, this.contentBuffer.data);
                    console.log('RESOLVED loadIoDataAndGetStatus');

                    resolve(200);
                })
                .catch(() => {
                    console.log('REJECTED loadIoDataAndGetStatus:  REASON UNKNOWN');
                    reject(500);});
        });
    }

/*
    private loadObjectWithContacts(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let parent = this.parent;
            if ((!parent) || (typeof parent == 'undefined')) {
                 parent      = new CGFolderSynk(this.user, this.entryId, undefined);
                 this.parent = parent;
             }
            return parent.loadMetadata()
                .then((e) => { return parent.resolveRW(); })
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                    this.parent = parent;
                    this.privateContacts = this.calcPrivateContacts();
                    resolve(true);
                })
                .catch(() => reject());
        });
    }

    */

    private loadObjectWithContacts(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let parent = this.parent;
            if ((!parent) || (typeof parent == 'undefined')) {
                 parent      = new CGFolderSynk(this.user, this.entryId, undefined);
                 this.parent = parent;
             }
             return parent.loadMetadata().then((parentMetadataResolved)=>{
                 return parent.resolveRW().then((parentRWResolved)=>{
                     return this.resolveRW().then((docRwResolved)=>{
                          console.log('RESOLVED: loadObjectWithContacts');
                          this.privateContacts = this.calcPrivateContacts();
                          resolve(true);
                     },(docRwRejected)=>{
                         console.log('OWNER RESOLVE RW FAILED');
                         reject();
                     });
                 },(parentRWFailed)=>{
                      console.log('PARENT RESOLE RW FAILED');
                      reject();
                 });
             },(parentMetadataFailed)=>{
                   console.log('PARENT METADATA FAILED');
                   reject();
             });
            
        });
    }

    private calcPrivateContacts(): IGContact[] {
        const buffer: IGContact[] = [];
        _.each(this.contacts, (contact: IGContact) => {
            if (!(_.findWhere(this.parent.contacts, contact))) {
                buffer.push(contact);
            }
        })
        return buffer;
    }

    private getIoArgs(folderId: string, data: string): IShieldoxIOProtectArgs {
        return {
            dirty: false,
            color: 0,
            objectId: undefined,
            data: data,
            protect: false,
            date: Date.parse(this.metadata.modifiedDate),
            path: this.metadata.title,
            cloudKey: this.metadata.id,
            folderId: folderId,
            size: this.metadata.fileSize
        }
    }

    constructor(user: ILoginInfo, entryId: string, metadata: IGFile, parent: CGFolderSynk) {
        super(user, entryId, metadata);
        this.parent = parent;
    }

}

export function getViewOptions(user: ILoginInfo, entryId: string): Promise<IShieldPathPermissions> {
    return new Promise((resolve, reject) => {
        const sync: CGFolderSynk = new CGFolderSynk(user, entryId, undefined);
        return sync.promise_loadView(false)
            .then((e) => resolve(e))
            .catch(() => reject());
    });
}

export function protectFile(user: ILoginInfo, entryId: string, color: number): Promise<IShieldoxIOProtectArgs> {
    return new Promise((resolve, reject) => {
        return (new CGFileSynk(user, entryId, undefined, undefined)).protect(color, true,undefined)
            .then((e) => resolve(e), (code) => reject(code));
    });
}

export function protectFolder(user: ILoginInfo, entryId: string, color: number): Promise<IShieldFolder> {
    return new Promise((resolve, reject) => {
        return (new CGFolderSynk(user, entryId, undefined)).protect(color)
            .then((e) => resolve(e), (code) => reject(code));
    });
}

export function colorUiLoadFile(user: ILoginInfo, entryId: string): Promise<IShieldColorResponse> {
    return new Promise((resolve, reject) => {
        return (new CGFileSynk(user, entryId, undefined, undefined)).colorUiLoad()
            .then((e) => resolve(e), (code) => reject(code));
    });
}

export function colorUiLoadFolder(user: ILoginInfo, entryId: string): Promise<IShieldColorResponse> {
    return new Promise((resolve, reject) => {
        return (new CGFolderSynk(user, entryId, undefined)).colorUiLoad()
            .then((e) => resolve(e), (code) => reject(code));
    });
}

export function colorFolderGetContext(user: ILoginInfo, entryId: string, color: number): Promise<IFolderWorkerRequestResponse> {
    return new Promise((resolve, reject) => {
        var context = new BackgndWorker(CRest.pData, user, entryId, color);
        return context.getContext()
            .then((e) => resolve(e))
            .catch((e) => reject(e))
    });

}