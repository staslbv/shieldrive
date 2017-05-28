"use strict";
class BackgndWorker {
    constructor(db, user, cloudKey, color) {
        this.db = db;
        this.user = user;
        this.cloudKey = cloudKey;
        this.color = color;
        this.FLAG_RESET_REQUIRED = false;
        this.FLAG_RESET_PROTECT_VALUE = false;
        this.FLAG_ENABLE_RUN_PROMISE_CHAIN = false;
    }
    beginScan() {
        return new Promise((resolve, reject) => {
            return this.db.workfolder.start(this.statusObj.id)
                .then((e) => {
                this.statusObj.frunning = true;
                resolve(true);
            })
                .catch((e) => resolve(false));
        });
    }
    cancelScan(fprotect) {
        return new Promise((resolve, reject) => {
            return this.db.workfolder.resetObject(this.statusObj.id, fprotect, true, true)
                .then((e) => {
                this.statusObj.fcancelPending = true;
                this.statusObj.fprotect = fprotect;
                this.statusObj.frunning = true;
                this.statusObj.fbackGnd = true;
                resolve(true);
            }, () => resolve(false));
        });
    }
    completeScan() {
        return new Promise((resolve, reject) => {
            return this.db.workfolder.stop(this.statusObj.id)
                .then((e) => {
                this.statusObj.frunning = false;
                this.statusObj.fbackGnd = false;
                this.FLAG_ENABLE_RUN_PROMISE_CHAIN = false;
                resolve(true);
            })
                .catch((e) => reject(e));
        });
    }
    getContext() {
        return new Promise((resolve, reject) => {
            return this.loadJobObjectAndGetRunning()
                .then((e) => {
                resolve({
                    enable: this.FLAG_ENABLE_RUN_PROMISE_CHAIN,
                    context: e
                });
            })
                .catch((e) => reject(e));
        });
    }
    // call load job and determine if job should be restarted.
    loadJobObjectAndGetRunning() {
        return new Promise((resolve, reject) => {
            var fresetRunRequired = false;
            return this.loadJobObject()
                .then((e) => {
                if (this.FLAG_RESET_REQUIRED && !e.frunning) {
                    console.log('NOT RUNNING , APPLYING RESET');
                    this.statusObj.fprotect = this.FLAG_RESET_PROTECT_VALUE;
                    this.statusObj.fcancelPending = false;
                    this.statusObj.fbackGnd = true;
                    return this.db.workfolder.resetObject(e.id, this.statusObj.fprotect, e.fbackGnd, false);
                }
                else {
                    return new Promise((resolve, reject) => { resolve(true); });
                }
            })
                .then(() => {
                this.FLAG_ENABLE_RUN_PROMISE_CHAIN = (this.statusObj.fbackGnd &&
                    !this.statusObj.frunning);
                resolve(this.statusObj);
            })
                .catch((e) => {
                console.log('REJECT loadJobObjectAndGetRunning');
                reject(e);
            });
        });
    }
    // load or create object and determine reset flags
    loadJobObject() {
        return new Promise((resolve, reject) => {
            return this.db.workfolder.getObject(this.cloudKey)
                .then((e) => {
                const fprotect = (this.color > 0);
                this.FLAG_RESET_REQUIRED = (fprotect != e.fprotect);
                this.FLAG_RESET_PROTECT_VALUE = fprotect;
                resolve((this.statusObj = e));
            }, (e) => {
                if (e == 404) {
                    return this.db.workfolder.createObject(this.cloudKey, this.user, true, this.color)
                        .then((e) => resolve((this.statusObj = e)))
                        .catch((e) => reject(e));
                }
                else {
                    reject(e);
                }
            });
        });
    }
}
exports.BackgndWorker = BackgndWorker;
//# sourceMappingURL=bkworker.js.map