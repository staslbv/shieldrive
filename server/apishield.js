"use strict";
const helpacc_1 = require("./helpacc");
const request = require('request');
const cryptojs = require('crypto-js');
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
exports.SUCCEEDED = SUCCEEDED;
function get_accId(user) {
    return ('0.0.' + user.account.account.type + '.' + cryptojs.MD5(user.account.account.key).toString());
}
exports.get_accId = get_accId;
function syncFolder(user, id, name) {
    return new Promise((resolve, reject) => {
        const params = {
            parentId: user.account.account.objectId,
            folderId: id,
            name: name
        };
        console.log('sync folder : ' + name);
        console.log(JSON.stringify(user, null, 4));
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/CreateFolder',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: params
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                console.log('folder synced ...');
                resolve(body);
            }
            else {
                reject();
            }
        });
    });
}
exports.syncFolder = syncFolder;
function colorFolder(user, params) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/color',
            method: 'PUT',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: params
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body);
            }
            else {
                reject();
            }
        });
    });
}
exports.colorFolder = colorFolder;
function syncContact(user, params) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/contact/sync',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: params
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body);
            }
            else {
                reject();
            }
        });
    });
}
exports.syncContact = syncContact;
function syncContactPromiseResolve(user, email, name) {
    return new Promise((resolve, reject) => {
        const params = { email: email, name: name, objectId: '' };
        return syncContact(user, params)
            .then((e) => resolve(e))
            .catch(() => resolve({ email: 'undefined', name: 'undefined', objectId: 'undefined' }));
    });
}
exports.syncContactPromiseResolve = syncContactPromiseResolve;
function lock(user, args) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/meta/lock',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            time: true,
            json: args
        }, (error, response, body) => {
            if (response) {
                console.log('LOCK RESPONSE: ' + response.statusCode);
            }
            if (SUCCEEDED(error, response)) {
                if (!body || typeof body.objectId != 'string' || body.objectId.length == 0) {
                    reject(500);
                }
                else {
                    resolve(body);
                }
            }
            else {
                reject(500);
            }
        });
    });
}
exports.lock = lock;
function decrypt(user, args) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/meta/decrypt',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            time: true,
            json: args
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                if (!body || !body.data) {
                    reject(500);
                }
                else {
                    resolve(body);
                }
            }
            else {
                reject(500);
            }
        });
    });
}
exports.decrypt = decrypt;
function obj2pdf(user, args) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/service/obj2pdf',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            time: true,
            json: args
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                if (!body) {
                    reject(500);
                }
                else {
                    resolve(body.data);
                }
            }
            else {
                reject(500);
            }
        });
    });
}
exports.obj2pdf = obj2pdf;
function options(user, args) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/meta/getoptions',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: args
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body);
            }
            else {
                reject();
            }
        });
    });
}
exports.options = options;
function calcColor(user, cloudKey) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/meta/getoptions',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: {
                folders: [],
                documents: [{
                        cloudKey: cloudKey
                    }]
            }
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body.documents[0].color);
            }
            else {
                reject();
            }
        });
    });
}
exports.calcColor = calcColor;
function scopeFolder(user, scope) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/scope',
            method: 'PUT',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: scope
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body);
            }
            else {
                resolve(500);
            }
        });
    });
}
exports.scopeFolder = scopeFolder;
function scopeDocument(user, objectId, scope) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/documents/scope',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": get_accId(user),
                "sldx_accType": user.account.account.type
            },
            json: {
                objectId: objectId,
                scope: scope
            }
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(200);
            }
            else {
                resolve(200);
            }
        });
    });
}
exports.scopeDocument = scopeDocument;
//# sourceMappingURL=apishield.js.map