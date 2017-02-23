"use strict";
const constant_1 = require("./constant");
const MODEL = require("./constant");
const request = require('request');
const cryptojs = require('crypto-js');
exports.SHIELDOX_BASE_URL = "https://api.shieldox.com/api";
function registerUser(db, user) {
    return new Promise((resolve, reject) => {
        return db.user.getObject(user)
            .then((user) => {
            resolve(user);
        }, (error) => {
            return db.user.createObject(user);
        }).then((user) => {
            resolve(user);
        }).catch((e) => {
            reject();
        });
    });
}
exports.registerUser = registerUser;
function registerAccount(db, user, account) {
    return new Promise((resolve, reject) => {
        var _userRef;
        return registerUser(db, user).then((u) => {
            _userRef = u;
            return db.account.getObject(_userRef, account).then((e) => {
                resolve({ user: _userRef, account: e });
            }, () => {
                return db.account.createObject(_userRef, account).then((e) => {
                    resolve({ user: _userRef, account: e });
                }, () => {
                    reject();
                });
            });
        }, () => {
            reject();
        });
    });
}
exports.registerAccount = registerAccount;
function registerTokenAccount(db, user, account, token) {
    var user_account;
    return new Promise((resolve, reject) => {
        return registerUser(db, user).then((e) => {
            return registerAccount(db, e, account).then((useracc) => {
                user_account = useracc;
                return db.token.getObject(useracc).then((result) => {
                    resolve(result);
                }, () => {
                    user_account.token = token;
                    return db.token.createObject(user_account).then((e) => {
                        resolve(e);
                    }).catch(() => {
                        reject();
                    });
                });
            }, (error) => {
                reject();
            });
        }, (error) => {
            reject();
        });
    });
}
exports.registerTokenAccount = registerTokenAccount;
function accType2ShieldoxType(type) {
    switch (type) {
        case constant_1.ACCOUNT_TYPE.DROPBOX:
            return 3;
        case constant_1.ACCOUNT_TYPE.DRIVE:
            return 2;
        default:
            return 2;
    }
}
exports.accType2ShieldoxType = accType2ShieldoxType;
function SUCCEEDED(error, response) {
    if (null == response || typeof response == 'undefined') {
        return false;
    }
    var code = response.statusCode;
    if (typeof code == 'number') {
        return ((code >= 200) && (code < 300));
    }
    return false;
}
function registerShieldAccount(db, account) {
    return new Promise((resolve, reject) => {
        request({
            url: exports.SHIELDOX_BASE_URL + '/user/SignwAcc',
            method: 'POST',
            json: {
                owner: { email: account.user.email },
                token: { data: account.token.token_hash },
                accountId: account.account.key,
                type: accType2ShieldoxType(account.account.type)
            }
        }, (error, response, body) => {
            if (!SUCCEEDED(error, response)) {
                reject();
            }
            else {
                resolve(body);
            }
        });
    });
}
exports.registerShieldAccount = registerShieldAccount;
function registerShieldAccountArgs(db, account, item) {
    return new Promise((resolve, reject) => {
        const email = item.email;
        const password = item.password;
        const objectId = item.objectId;
        account.account.objectId = item.account.objectId;
        return db.account.update({
            [MODEL.PID_OBJECTID]: account.account.objectId
        }, { where: { [MODEL.PID_ID]: account.account.id } })
            .then((flag) => {
            const sysacc = {
                [MODEL.PID_TYPE]: constant_1.ACCOUNT_TYPE.SYSTEM,
                [MODEL.PID_OBJECTID]: objectId,
                [MODEL.PID_KEY]: email
            };
            const systoken = {
                [MODEL.PID_ACCESS_TOKEN]: new Buffer(email + ':' + password).toString('base64')
            };
            return registerTokenAccount(db, account.user, sysacc, systoken).then((e) => {
                resolve(e);
            }, () => reject());
        }, (e) => {
            reject();
        });
    });
}
exports.registerShieldAccountArgs = registerShieldAccountArgs;
function registerShieldTokenAccount(db, user, account, token) {
    var _account;
    return new Promise((resolve, reject) => {
        return registerTokenAccount(db, user, account, token).then((useracc) => {
            return registerShieldAccount(db, useracc).then((item) => {
                _account = useracc;
                return registerShieldAccountArgs(db, useracc, item).then((e) => {
                    resolve({
                        authorization: 'Basic ' + e.token.access_token,
                        account: _account
                    });
                }).catch(() => {
                    reject();
                });
            }, () => {
                reject();
            });
        }, () => {
            reject();
        });
    });
}
exports.registerShieldTokenAccount = registerShieldTokenAccount;
function authorize(db, authorization, accId) {
    return new Promise((resolve, reject) => {
        console.log('searching: ' + authorization + ' : ' + accId);
        var shieldoxToken; // auth for shieldox service
        var token; // auth for cloud service
        var user; // system user
        var account; // cloud account
        if (typeof authorization == 'undefined' || typeof accId == 'undefined') {
            reject();
        }
        else {
            let nauth = authorization.split(' ');
            if (nauth.length != 2 || nauth[0].trim() != 'Basic') {
                reject();
            }
            else {
                return db.token.findOne({ where: { [MODEL.PID_TOKEN_HASH]: cryptojs.MD5(nauth[1].trim()).toString() }
                }).then((e) => {
                    if (!e) {
                        reject(); // can not locate specifit auth info
                    }
                    else {
                        shieldoxToken = e;
                        return db.user.findOne({ where: { [MODEL.PID_ID]: e.userId } }).then((e) => {
                            if (!e) {
                                reject(); // can not locate parent user
                            }
                            else {
                                user = e;
                                return db.account.findOne({ where: { [MODEL.PID_USER_PKEY]: user.id, [MODEL.PID_KEY]: accId } })
                                    .then((e) => {
                                    if (!e) {
                                        reject();
                                    }
                                    else {
                                        account = e;
                                        return db.token.findOne({ where: { [MODEL.PID_USER_PKEY]: user.id, [MODEL.PID_ACCOUNT_PKEY]: account.id } })
                                            .then((e) => {
                                            if (!e) {
                                                reject();
                                            }
                                            else {
                                                token = e;
                                                resolve({ token: shieldoxToken, account: { user: user, account: account, token: token } });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }).catch(() => { reject(); });
            }
        }
    });
}
exports.authorize = authorize;
