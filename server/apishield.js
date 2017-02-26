"use strict";
const helpacc_1 = require("./helpacc");
const request = require('request');
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
function syncFolder(user, id, name) {
    return new Promise((resolve, reject) => {
        const params = {
            parentId: user.account.account.objectId,
            folderId: id,
            name: name
        };
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/CreateFolder',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
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
exports.syncFolder = syncFolder;
function colorFolder(user, params) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/color',
            method: 'PUT',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
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
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
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
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
            },
            json: args
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body);
            }
            else {
                reject(500);
            }
        });
    });
}
exports.lock = lock;
function options(user, args) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/meta/getoptions',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
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
function scopeFolder(user, scope) {
    return new Promise((resolve, reject) => {
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/scope',
            method: 'PUT',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
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
        console.log('calling scope: ');
        console.log(JSON.stringify(scope, null, 4));
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/documents/scope',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
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
