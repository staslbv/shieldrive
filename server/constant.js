"use strict";
exports.PID_ID = 'id';
exports.PID_EMAIL = 'email';
exports.PID_TYPE = 'type';
exports.PID_KEY = 'key';
exports.PID_TOKEN_HASH = 'token_hash';
exports.PID_USER_PKEY = 'userId';
exports.PID_ACCOUNT_PKEY = 'accountId';
exports.PID_OBJECTID = 'objectId';
exports.PID_TOKEN_TYPE = 'token_type';
exports.PID_ACCESS_TOKEN = 'access_token';
exports.PID_CLIENT_ID = 'client_id';
exports.PID_UID = 'uid';
exports.PID_CLOUDKEY = 'cloudKey';
// Worker
exports.PID_JOB_FLAG_BACKGND = 'fbackGnd';
exports.PID_JOB_FLAG_CANCELPENDING = 'fcancelPending';
exports.PID_JOB_FLAG_PROTECT = 'fprotect';
exports.PID_JOB_FLAG_RUNNING = 'frunning';
exports.PID_JOB_PROCESS_ID = 'processId';
// Precognition fields
exports.PID_URL_HOST = 'host';
exports.PID_URL_PATH = 'pathname';
exports.PID_URL_HOST_PKEY = 'precoHostId';
exports.Log = new (require('le_node'))({
    token: '68d9bd5b-3a90-4fe1-a1e8-329df5f1f2ec'
});
class ICountArg {
    constructor() {
        this.MAX_COUNT = 5;
        this.count = this.MAX_COUNT;
        this.completed = false;
        this.body = undefined;
        this.sleeptime = 0;
    }
    get sleep() {
        this.sleeptime += 1;
        return 1000 * this.sleeptime;
    }
}
exports.ICountArg = ICountArg;
var ACCOUNT_TYPE;
(function (ACCOUNT_TYPE) {
    ACCOUNT_TYPE[ACCOUNT_TYPE["SYSTEM"] = 0] = "SYSTEM";
    ACCOUNT_TYPE[ACCOUNT_TYPE["SHIELDOX"] = 1] = "SHIELDOX";
    ACCOUNT_TYPE[ACCOUNT_TYPE["DRIVE"] = 5] = "DRIVE";
    ACCOUNT_TYPE[ACCOUNT_TYPE["ONEDRIVE"] = 7] = "ONEDRIVE";
})(ACCOUNT_TYPE = exports.ACCOUNT_TYPE || (exports.ACCOUNT_TYPE = {}));
;
var WORKER_COMPLETE_STATE;
(function (WORKER_COMPLETE_STATE) {
    WORKER_COMPLETE_STATE[WORKER_COMPLETE_STATE["STATE_PENDING"] = 0] = "STATE_PENDING";
    WORKER_COMPLETE_STATE[WORKER_COMPLETE_STATE["STATUS_SUCCESS"] = 1] = "STATUS_SUCCESS";
    WORKER_COMPLETE_STATE[WORKER_COMPLETE_STATE["STATUS_ERROR"] = 2] = "STATUS_ERROR";
})(WORKER_COMPLETE_STATE = exports.WORKER_COMPLETE_STATE || (exports.WORKER_COMPLETE_STATE = {}));
;
//# sourceMappingURL=constant.js.map