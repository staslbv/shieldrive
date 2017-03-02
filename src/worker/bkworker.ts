import * as FIELD  from                    '../constant';
import * as gdrive from                    '../REST/gdrive';
import * as apishield from                 '../apishield';

import {IFolderWorkerStatus} from          '../constant';
import {CDb} from                          '../DATABASE/db';
import {ILoginInfo} from                   '../constant';
import {IFolderWorkerRequestResponse} from '../constant';
import {CGFolderSynk} from                 './folder';

export class BackgndWorker
{
    statusObj:                     IFolderWorkerStatus;
     
    FLAG_RESET_REQUIRED:           boolean;
    FLAG_RESET_PROTECT_VALUE:      boolean;
    FLAG_ENABLE_RUN_PROMISE_CHAIN: boolean;

    public beginScan(): Promise<boolean>{
        return new Promise((resolve,reject)=>{
            return this.db.workfolder.start(this.statusObj.id)
            .then((e)=>{
                this.statusObj.frunning = true;
                resolve(true);})
            .catch((e: number)=>resolve(false));
        });
    }

    public cancelScan(fprotect: boolean): Promise<boolean>{
        return new Promise((resolve,reject)=>{
            return this.db.workfolder.resetObject(this.statusObj.id, fprotect, true, true)
            .then((e)=>{
                this.statusObj.fcancelPending = true;
                this.statusObj.fprotect       = fprotect;
                this.statusObj.frunning       = true;
                this.statusObj.fbackGnd       = true;
                resolve(true);
            },()=>resolve(false));
        });
    }

    public completeScan(): Promise<boolean>{
        return new Promise((resolve,reject)=>{
            return this.db.workfolder.stop(this.statusObj.id)
            .then((e)=>{
                this.statusObj.frunning            = false;
                this.statusObj.fbackGnd            = false;
                this.FLAG_ENABLE_RUN_PROMISE_CHAIN = false;
                resolve(true);})
            .catch((e: number)=>reject(e));
        });
    }
    

    public getContext() : Promise<IFolderWorkerRequestResponse>{
        return new Promise((resolve,reject)=>{
            return this.loadJobObjectAndGetRunning()
            .then((e)=>{
                resolve({
                    enable:  this.FLAG_ENABLE_RUN_PROMISE_CHAIN,
                    context: e
                });
            })
            .catch((e)=>reject(e));
        });
    }
    
     // call load job and determine if job should be restarted.
     private loadJobObjectAndGetRunning() : Promise <IFolderWorkerStatus>{
         return new Promise((resolve,reject)=>{
             var fresetRunRequired: boolean = false;
             return this.loadJobObject()
             .then((e)=>{
                if (this.FLAG_RESET_REQUIRED && !e.frunning ){
                    console.log('NOT RUNNING , APPLYING RESET');
                    this.statusObj.fprotect       = this.FLAG_RESET_PROTECT_VALUE;
                    this.statusObj.fcancelPending = false;
                    this.statusObj.fbackGnd       = true;
                    return this.db.workfolder.resetObject(e.id, this.statusObj.fprotect, e.fbackGnd, false);
                }else{
                    return new Promise<boolean>((resolve,reject)=>{resolve(true)});
                }
             })
             /*
             .then(()=>{ // handle is running
                if (this.statusObj.fbackGnd){
                     fresetRunRequired = ((!this.statusObj.frunning) || (this.statusObj.processId != process.pid));
                }else{
                   // fresetRunRequired = true;
                }
                if (fresetRunRequired){
                    console.log('REANIMATING ...');
                    this.statusObj.frunning = false;
                    return this.db.workfolder.stopRunning(this.statusObj.id);
                }else{
                    return new Promise<boolean>((resolve,reject)=>{resolve(true)});
                }
             }) */
             .then(()=>{
                 this.FLAG_ENABLE_RUN_PROMISE_CHAIN = (
                     this.statusObj.fbackGnd && 
                    !this.statusObj.frunning);
                 resolve(this.statusObj);
             })
             .catch((e)=>reject(e));
         });
     }

     // load or create object and determine reset flags
     public loadJobObject(): Promise<IFolderWorkerStatus>{
        return new Promise((resolve,reject)=>{
            return this.db.workfolder.getObject(this.cloudKey)
            .then((e : IFolderWorkerStatus)=>{
               const fprotect: boolean       = (this.color > 0);
               this.FLAG_RESET_REQUIRED      = (fprotect != e.fprotect) ;
               this.FLAG_RESET_PROTECT_VALUE = fprotect;
               resolve((this.statusObj       = e));
            }, (e: number)=>{
                if (e == 404){
                    return this.db.workfolder.createObject(this.cloudKey, this.user, true, this.color)
                    .then((e)=>resolve((this.statusObj = e)))
                    .catch((e)=>reject(e));
                }else{
                    reject(e);
                }
            });
        });
     }

     constructor(public db: CDb, public user: ILoginInfo, public cloudKey: string, public color: number){
        this.FLAG_RESET_REQUIRED             = false;
        this.FLAG_RESET_PROTECT_VALUE        = false;
        this.FLAG_ENABLE_RUN_PROMISE_CHAIN   = false;
     }
}

