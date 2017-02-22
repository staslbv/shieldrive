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
// Precognition fields
exports.PID_URL_HOST = 'host';
exports.PID_URL_PATH = 'pathname';
exports.PID_URL_HOST_PKEY = 'precoHostId';
var ACCOUNT_TYPE;
(function (ACCOUNT_TYPE) {
    ACCOUNT_TYPE[ACCOUNT_TYPE["SYSTEM"] = 0] = "SYSTEM";
    ACCOUNT_TYPE[ACCOUNT_TYPE["SHIELDOX"] = 1] = "SHIELDOX";
    ACCOUNT_TYPE[ACCOUNT_TYPE["DROPBOX"] = 2] = "DROPBOX";
    ACCOUNT_TYPE[ACCOUNT_TYPE["DRIVE"] = 3] = "DRIVE";
})(ACCOUNT_TYPE = exports.ACCOUNT_TYPE || (exports.ACCOUNT_TYPE = {}));
;
;
