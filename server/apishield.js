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
            .catch(() => resolve(undefined));
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
