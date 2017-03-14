"use strict";
const gdrive = require("../REST/gdrive");
const apishield = require("../apishield");
const bkworker_1 = require("./bkworker");
const rest_1 = require("../REST/rest");
const _ = require('underscore');
const GDRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
//
const spawn = require('threads').spawn;
function cancelationPending(context) {
    return new Promise((resolve, reject) => {
        if (!context || typeof context == 'undefined') {
            resolve(false);
        }
        else {
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
class CGEntry {
    constructor(user, id, metadata) {
        this.metadata = metadata;
        this.FLAG_CONTACTS_RESOLVED = false;
        this.user = user;
        this.entryId = id;
        this.permissions = undefined;
        this.role = undefined;
        this.canRW = false;
        this.flagOwner = false;
        this.contacts = [];
    }
    get hasLoadedMetadata() {
        return (_.isObject(this.metadata) &&
            _.isString(this.metadata.id) &&
            _.isString(this.metadata.mimeType));
    }
    get isFolder() {
        return (this.metadata.mimeType == GDRIVE_FOLDER_MIME_TYPE);
    }
    //load metadata: parents, owners, title, mimeType, fileSize, modifiedDate
    resolve_loadMetadata() {
        return new Promise((resolve, reject) => {
            if (typeof this.metadata == 'object') {
                resolve(this.metadata);
            }
            else {
                return gdrive.list_file_metadata(this.user, this.entryId)
                    .then((e) => resolve((this.metadata = e)))
                    .catch(() => reject());
            }
        });
    }
    // load contacts: emailAddress, role, name
    resolve_loadPermissions() {
        return new Promise((resolve, reject) => {
            if (typeof this.permissions == 'object') {
                resolve(this.permissions);
            }
            else {
                return gdrive.rest_file_contacts(this.user, this.entryId)
                    .then((e) => { resolve((this.permissions = e)); })
                    .catch(() => reject());
            }
        });
    }
    // iterate object permissions 
    resolve_identifyCallerPermissions() {
        return new Promise((resolve, reject) => {
            _.each(_.indexBy(this.permissions, 'emailAddress'), (value, key) => {
                let mail = key.toLowerCase();
                if (this.user.account.user.email.toLocaleLowerCase() == mail ||
                    this.user.account.account.key.toLocaleLowerCase() == mail) {
                    this.role = value;
                }
                else {
                    this.contacts.push(value);
                }
            });
            resolve(this.role);
        });
    }
    // set canRW and flagOwner flags
    resolve_callerPermissions() {
        return new Promise((resolve, reject) => {
            if (!this.role) {
                resolve(false);
            }
            else {
                this.canRW = (this.role.role == 'owner' || this.role.role == 'writer');
                this.flagOwner = (this.role.role == 'owner');
                resolve(this.canRW);
            }
        });
    }
    // general load function. 
    loadMetadata() {
        return new Promise((resolve, reject) => {
            if (this.metadata) {
                resolve(true);
            }
            else {
                return this.resolve_loadMetadata()
                    .then((e) => resolve(true))
                    .catch(() => {
                    console.log('ERROR: UNABLE TO RESOLVE OBJECT METADATA');
                    reject();
                });
            }
        });
    }
    resolveRW() {
        return new Promise((resolve, reject) => {
            return this.resolve_loadPermissions()
                .then((e) => { return this.resolve_identifyCallerPermissions(); })
                .then((e) => { return this.resolve_callerPermissions(); })
                .then((e) => resolve(this.canRW))
                .catch(() => reject());
        });
    }
    // sync all contacts to IShieldoxContact
    syncAB(contacts) {
        return new Promise((resolve, reject) => {
            return Promise.all(contacts.map((contact) => {
                return apishield.syncContactPromiseResolve(this.user, contact.emailAddress, contact.name);
            })).then((e) => {
                resolve(e);
            });
        });
    }
    toShieldPolicyScope(contacts) {
        return new Promise((resolve, reject) => {
            return this.syncAB(contacts).then((e) => {
                const arr = [];
                e.forEach((contact) => {
                    if (contact.objectId != 'undefined') {
                        arr.push({
                            objectId: contact.objectId, enabled: true,
                            canedit: true // here call function to determine actual value 
                        });
                    }
                });
                const va = {
                    groups: {},
                    contacts: _.indexBy(arr, 'objectId')
                };
                resolve(va);
            }).catch((code) => resolve(undefined));
        });
    }
    toShieldPolicyScopeInfo(contacts, fautoscope) {
        return new Promise((resolve, reject) => {
            return this.toShieldPolicyScope(contacts).then((e) => {
                resolve({
                    fautoscope: fautoscope,
                    scope: e
                });
            }).catch(() => resolve(undefined));
        });
    }
    toShieldFolderScopeRef(contacts, fautoscope, objectId) {
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
}
exports.CGEntry = CGEntry;
class CGFolderSynk extends CGEntry {
    // synchronize current folder and get objectId
    syncFolder() {
        return new Promise((resolve, reject) => {
            return apishield.syncFolder(this.user, this.metadata.id, this.metadata.title)
                .then((e) => resolve((this.shieldObj = e)))
                .catch(() => reject());
        });
    }
    promise_loadView_All(recursive) {
        return new Promise((resolve, reject) => {
            return this.promise_loadView(recursive)
                .then((e) => resolve(e))
                .catch(() => resolve(undefined));
        });
    }
    promise_loadView(recursive) {
        return new Promise((resolve, reject) => {
            return this.loadMetadata() // got permissions and shared list
                .then((e) => {
                return gdrive.list_objects_folder(this.user, this.entryId);
            })
                .then((e) => {
                _.each(_.groupBy(e, 'mimeType'), (e, type) => {
                    let flagFolder = (type == GDRIVE_FOLDER_MIME_TYPE);
                    e.forEach((e) => {
                        if (flagFolder) {
                            this.folders.push(new CGFolderSynk(this.user, e.id, e));
                        }
                        else {
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
    promise_loadViewChildren(recursive) {
        return new Promise((resolve, reject) => {
            return this.promise_loadViewChildren_Folders(recursive)
                .then(() => {
                return this.promise_loadViewChildren_Files(recursive);
            })
                .then(() => resolve(true))
                .catch(() => reject());
        });
    }
    promise_loadViewChildren_Files(recursive) {
        return new Promise((resolve, reject) => {
            return Promise.all(this.files.map((file) => {
                return file.loadMetadata();
            })).then(() => {
                resolve(true);
            }).catch(() => reject());
        });
    }
    promise_loadViewChildren_Folders(recursive) {
        return new Promise((resolve, reject) => {
            return Promise.all(this.folders.map((folder) => {
                return folder.loadMetadata();
            })).then(() => {
                if (!recursive) {
                    resolve(true);
                }
                else {
                    return Promise.all(this.folders.map((folder) => {
                        return folder.promise_loadView_All(recursive);
                    })).then(() => {
                        console.log('>>>>>>>>>>>>>>>>>>>>>>  RESOLVED RECURSIVE');
                        resolve(true);
                    });
                }
            }).catch(() => reject());
        });
    }
    promise_loadViewShieldPermissions(recursive) {
        return new Promise((resolve, reject) => {
            const pFolders = [];
            const pDocuments = [];
            // fill up array for getOptions call
            this.folders.forEach((folder) => pFolders.push({ cloudKey: folder.entryId }));
            this.files.forEach((file) => pDocuments.push({ cloudKey: file.entryId }));
            // call shieldox
            return apishield.options(this.user, {
                folders: pFolders,
                documents: pDocuments
            }).then((e) => {
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
    colorUiLoad() {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                if (!this.canRW) {
                    reject(403);
                }
                else {
                    return this.syncFolder();
                }
            })
                .then((e) => { return this.calcUiOptions(); })
                .then((e) => { resolve(e); })
                .catch(() => reject(500));
        });
    }
    calcUiOptions() {
        return new Promise((resolve, reject) => {
            var args = {
                documents: [],
                folders: [{ cloudKey: this.entryId }]
            };
            return apishield.options(this.user, args)
                .then((e) => {
                let colors = _.pick(e.folders[0], 'color', 'colors');
                let response = {
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
    updateSharedContacts() {
        return new Promise((resolve, reject) => {
            return this.toShieldFolderScopeRef(this.contacts, false, this.shieldObj.objectId)
                .then((e) => {
                return apishield.scopeFolder(this.user, e);
            })
                .then((e) => resolve(e))
                .catch((e) => reject(e));
        });
    }
    protect(color) {
        return new Promise((resolve, reject) => {
            var context;
            var cancelation_pending = false;
            return this.loadMetadata()
                .then((e) => { return this.resolveRW(); })
                .then((e) => {
                if (!this.canRW) {
                    reject(403);
                }
                else {
                    return this.syncFolder();
                }
            })
                .then((e) => { return this.updateSharedContacts(); })
                .then((e) => { return apishield.colorFolder(this.user, { color: color, objectId: this.shieldObj.objectId }); })
                .then((e) => {
                const dirty = (this.shieldObj.color > 0 && e.color == 0) || (this.shieldObj.color == 0 && e.color > 0);
                this.shieldObj = e;
                e['dirty'] = dirty;
                if (dirty) {
                    return (context = new bkworker_1.BackgndWorker(rest_1.CRest.pData, this.user, this.entryId, e.color)).getContext();
                }
                else {
                    resolve(e);
                }
            })
                .then((e) => {
                if (e.context.frunning) {
                    console.log('>>>>>>>>>>>>>>>>>>>>>      CANCELING CURRENT SCAN');
                    return context.cancelScan(this.shieldObj.color > 0);
                }
                else if (e.enable) {
                    console.log('>>>>>>>>>>>>>>>>>>>>       BEGINNING NEW SCAN');
                    return context.beginScan();
                }
                else {
                    console.log('>>>>>>>>>>>>>>>>>>>>       NO ACTION TAKEN');
                    resolve(e);
                }
            })
                .then((e) => {
                if (!context.statusObj.fcancelPending) {
                    this.batchSpawn(this.shieldObj, context);
                }
                else {
                    console.log('>>>>>>>>>>>>>>>>>>>>       CANCELATION PENDING ...');
                }
                resolve(this.shieldObj);
            })
                .catch(() => reject(500));
        });
    }
    batchSpawn(folder, context) {
        const thread = spawn("worker//process.js");
        thread.send({
            user: this.user,
            entryId: this.entryId,
            metadata: this.metadata,
            folder: folder,
            context: context.statusObj
        })
            .on('message', function (response) {
            console.log('THREAD COMPLETED !');
            thread.kill();
        })
            .on('error', (error) => {
            console.log('THREAD ERROR ! : ' + error);
        })
            .on('exit', () => {
            console.log('THREAD EXIT !');
        });
    }
    batchProtect(folder, context) {
        this.folders = [];
        this.files = [];
        console.log('batchProtecting ....');
        return new Promise((resolve, reject) => {
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
                            }
                            else {
                                return context.completeScan().then((e) => {
                                    console.log('>>>>>>>>>>>>>>>>>>>>>  --SCAN--COMPLETED--');
                                    resolve();
                                });
                            }
                        });
                    });
                }).catch((BEGIN_SCAN_ERROR_CODE) => {
                    reject();
                });
            }).catch((e) => {
                reject();
            });
        });
    }
    constructor(user, entryId, metadata) {
        super(user, entryId, metadata);
        this.shieldObj = undefined;
        this.folders = [];
        this.files = [];
    }
}
exports.CGFolderSynk = CGFolderSynk;
class CGFileSynk extends CGEntry {
    updateSharedContacts() {
        return new Promise((resolve, reject) => {
            return this.toShieldPolicyScope(this.privateContacts)
                .then((e) => {
                return apishield.scopeDocument(this.user, this.contentIoArgs.objectId, e);
            })
                .then((e) => resolve(e))
                .catch((e) => reject(e));
        });
    }
    protect_promise(color, force, context) {
        return new Promise((resolve, reject) => {
            try {
                return this.protect(color, force, context)
                    .then((e) => resolve(e))
                    .catch(() => resolve(undefined));
            }
            catch (Error) {
                console.log('ERROR: ' + Error);
                resolve(undefined);
            }
        });
    }
    protect(color, force, context) {
        return new Promise((resolve, reject) => {
            console.log('PROTECTING: ' + this.metadata.title);
            return this.loadIoDataAndGetStatus()
                .then((code) => { return cancelationPending(context); })
                .then((canceled) => {
                if ((canceled) || (this.parent.shieldObj.color > 0 && color == 0) || !this.canRW) {
                    console.log('PROTECT REJECTED: REASON #1');
                    reject(409); // can not unprotect file in folder or operation canceled...
                }
                else {
                    this.contentIoArgs.color = color;
                    this.contentIoArgs.protect = force;
                    if (color == 0 && this.parent.shieldObj.color > 0) {
                        this.contentIoArgs.protect = false;
                    }
                    else if ((color == 0 && this.parent.shieldObj.color == 0) ||
                        ((color > 0) && (this.parent.shieldObj.color > 0) && (color != this.parent.shieldObj.color))) {
                        this.contentIoArgs.protect = true;
                    }
                    console.log('Calling lock ...');
                    return apishield.lock(this.user, this.contentIoArgs);
                }
            })
                .then((e) => {
                this.contentBuffer.data = e.data;
                this.contentIoArgs = e;
                return cancelationPending(context);
            })
                .then((canceled) => {
                if (canceled) {
                    console.log('PROTECT REJECTED: REASON #2');
                    reject(409);
                }
                else {
                    if (!this.contentIoArgs.dirty) {
                        resolve(this.contentIoArgs);
                    }
                    else {
                        console.log('Calling upload ...');
                        return gdrive.file_upload(this.user, this.metadata.id, this.contentBuffer);
                    }
                }
            })
                .then((e) => {
                console.log('PROTECT ACCEPTED, Notifieng: ' + this.metadata.title);
                delete this.contentIoArgs.data;
                delete this.contentIoArgs.protect;
                resolve(this.contentIoArgs);
            })
                .catch((code) => {
                console.log('PROTECT REJECTED: REASON#4 ' + this.metadata.title);
                reject(code);
            });
        });
    }
    colorUiLoad() {
        return new Promise((resolve, reject) => {
            return this.loadIoDataAndGetStatus()
                .then((e) => {
                if (!this.canRW) {
                    reject(403);
                }
                else {
                    return apishield.lock(this.user, this.contentIoArgs);
                }
            })
                .then((e) => {
                this.contentBuffer.data = e.data;
                this.contentIoArgs = e;
                if (!_.isString(e.objectId) || e.objectId.length == 0) {
                    reject(415);
                }
                else {
                    return this.calcUiOptions();
                }
            })
                .then((e) => {
                resolve(e);
            })
                .catch((code) => reject(code));
        });
    }
    calcUiOptions() {
        return new Promise((resolve, reject) => {
            var args = {
                folders: [],
                documents: [{ cloudKey: this.entryId }]
            };
            return apishield.options(this.user, args)
                .then((e) => {
                let colors = _.pick(e.documents[0], 'color', 'colors');
                let response = {
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
    loadIoDataAndGetStatus() {
        return new Promise((resolve, reject) => {
            return this.loadMetadata()
                .then((e) => { return this.loadObjectWithContacts(); })
                .then((e) => {
                if (typeof this.role == 'undefined') {
                    console.log('REJECTED loadIoDataAndGetStatus:  ROLE IS NULL');
                    reject(401);
                }
                else {
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
                reject(500);
            });
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
    loadObjectWithContacts() {
        return new Promise((resolve, reject) => {
            let parent = this.parent;
            if ((!parent) || (typeof parent == 'undefined')) {
                parent = new CGFolderSynk(this.user, this.entryId, undefined);
                this.parent = parent;
            }
            return parent.loadMetadata().then((parentMetadataResolved) => {
                return parent.resolveRW().then((parentRWResolved) => {
                    return this.resolveRW().then((docRwResolved) => {
                        console.log('RESOLVED: loadObjectWithContacts');
                        this.privateContacts = this.calcPrivateContacts();
                        resolve(true);
                    }, (docRwRejected) => {
                        console.log('OWNER RESOLVE RW FAILED');
                        reject();
                    });
                }, (parentRWFailed) => {
                    console.log('PARENT RESOLE RW FAILED');
                    reject();
                });
            }, (parentMetadataFailed) => {
                console.log('PARENT METADATA FAILED');
                reject();
            });
        });
    }
    calcPrivateContacts() {
        const buffer = [];
        _.each(this.contacts, (contact) => {
            if (!(_.findWhere(this.parent.contacts, contact))) {
                buffer.push(contact);
            }
        });
        return buffer;
    }
    getIoArgs(folderId, data) {
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
        };
    }
    constructor(user, entryId, metadata, parent) {
        super(user, entryId, metadata);
        this.parent = parent;
    }
}
exports.CGFileSynk = CGFileSynk;
function getViewOptions(user, entryId) {
    return new Promise((resolve, reject) => {
        const sync = new CGFolderSynk(user, entryId, undefined);
        return sync.promise_loadView(false)
            .then((e) => resolve(e))
            .catch(() => reject());
    });
}
exports.getViewOptions = getViewOptions;
function protectFile(user, entryId, color) {
    return new Promise((resolve, reject) => {
        var file = new CGFileSynk(user, entryId, undefined, undefined);
        return file.loadMetadata().then((e) => {
            return file.protect(color, true, undefined).then((e) => resolve(e), (code) => reject(code));
        }).catch((e) => reject(e));
    });
}
exports.protectFile = protectFile;
function protectFolder(user, entryId, color) {
    return new Promise((resolve, reject) => {
        return (new CGFolderSynk(user, entryId, undefined)).protect(color)
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.protectFolder = protectFolder;
function colorUiLoadFile(user, entryId) {
    return new Promise((resolve, reject) => {
        return (new CGFileSynk(user, entryId, undefined, undefined)).colorUiLoad()
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.colorUiLoadFile = colorUiLoadFile;
function colorUiLoadFolder(user, entryId) {
    return new Promise((resolve, reject) => {
        return (new CGFolderSynk(user, entryId, undefined)).colorUiLoad()
            .then((e) => resolve(e), (code) => reject(code));
    });
}
exports.colorUiLoadFolder = colorUiLoadFolder;
function colorFolderGetContext(user, entryId, color) {
    return new Promise((resolve, reject) => {
        var context = new bkworker_1.BackgndWorker(rest_1.CRest.pData, user, entryId, color);
        return context.getContext()
            .then((e) => resolve(e))
            .catch((e) => reject(e));
    });
}
exports.colorFolderGetContext = colorFolderGetContext;
