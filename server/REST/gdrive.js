"use strict";
const request = require('request');
const _ = require('underscore');
const helpacc_1 = require("../helpacc");
;
;
;
exports.IGFile_FIELD = 'id,title,fileExtension,fileSize,owners,parents';
;
const GOOGLE_DRIVE_URL = 'https://www.googleapis.com';
function SUCCEEDED(error, response) {
    if (null == response || typeof response == 'undefined') {
        console.log('request error: NO RESPONSE');
        return false;
    }
    var code = response.statusCode;
    if (typeof code == 'number') {
        console.log('error code: ' + code);
        return ((code >= 200) && (code < 300));
    }
    return false;
}
function getAuthHeader(user) {
    return user.account.token.token_type + ' ' + user.account.token.access_token;
}
function authorize(user) {
    return new Promise((resolve, reject) => {
        resolve();
    });
}
function isValidMIME_Type(mime) {
    const values = [
        'application/vnd.google-apps.folder',
        'office',
        'msword',
        'ms-excel',
        'ms-powerpoint',
        'application/pdf',
        'application/x-pdf',
        'application/vnd.pdf',
        'application/acrobat'
    ];
    if (mime && typeof mime == 'string' && mime.length > 0) {
        mime = mime.toLowerCase();
        for (var i = 0; i < values.length; i++) {
            if (mime.indexOf(values[i]) >= 0) {
                return true;
            }
        }
    }
    return false;
}
function rest_list_files_scan(user, flagFolder, buffer, title, token) {
    return new Promise((resolve, reject) => {
        var url = '/drive/v2/files?';
        const q_title = ((title && typeof title == 'string' && title.length > 0) ? " and title=\'" + title + "\')" : ')');
        const q_FOLDER = "q=(" + encodeURIComponent("mimeType=\'application/vnd.google-apps.folder\'" + q_title);
        const q_FILE = "q=(" + encodeURIComponent("(mimeType contains \'office\' or mimeType contains \'msword\' or mimeType contains \'ms-excel\' or mimeType contains \'ms-powerpoint\' or mimeType contains \'application/pdf\' or mimeType contains \'application/x-pdf\' or mimeType contains \'application/vnd.pdf\' or mimeType contains \'application/acrobat\')" + q_title);
        url += (flagFolder ? q_FOLDER : q_FILE);
        if (token && typeof token == 'string' && token.length > 0) {
            url += '&pageToken=' + token;
        }
        request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'GET',
            headers: {
                Authorization: getAuthHeader(user)
            },
            json: true
        }, (error, response, body) => {
            if (SUCCEEDED(error, response) && body && body.items) {
                buffer.push(...body.items);
                if (body.items.length == 0 || typeof body.nextPageToken != 'string' || body.nextPageToken.length == 0) {
                    resolve(body);
                }
                else {
                    resolve(rest_list_files_scan(user, flagFolder, buffer, title, body.nextPageToken));
                }
            }
            else {
                reject();
            }
        });
    });
}
function rest_list_object_folder(user, buffer, rid, token) {
    return new Promise((resolve, reject) => {
        var url = '/drive/v2/files?q=' + encodeURIComponent("\'" + rid + "\' in parents");
        request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) }, json: true
        }, (error, response, body) => {
            if (SUCCEEDED(error, response) && body && body.items) {
                buffer.push(...body.items);
                if (body.items.length == 0 || typeof body.nextPageToken != 'string' || body.nextPageToken.length == 0) {
                    resolve(body);
                }
                else {
                    resolve(rest_list_object_folder(user, buffer, rid, body.nextPageToken));
                }
            }
            else {
                reject();
            }
        });
    });
}
function rest_list_files_metadata(user, item) {
    return new Promise((resolve, reject) => {
        var result = undefined;
        var url = '/drive/v2/files/' + item.id;
        console.log('item: ' + url);
        request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) },
            json: true
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                result = body;
            }
            resolve(result);
        });
    });
}
function rest_file_download(user, id) {
    return new Promise((resolve, reject) => {
        request({
            url: GOOGLE_DRIVE_URL + '/drive/v3/files/' + id + '?alt=media',
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) },
            json: false,
            encoding: null
        }, (error, response, body) => {
            // response.headers['content-type']
            if (!SUCCEEDED(error, response)) {
                resolve(undefined);
            }
            else {
                resolve({ id: id, contentType: response.headers['content-type'], data: body.toString('base64') });
            }
        });
    });
}
function rest_file_upload(user, content) {
    return new Promise((resolve, reject) => {
        const url = '/upload/drive/v2/files/' + content.id + '?uploadType=media&newRevision=false&updateViewedDate=false';
        console.log(url + ' ' + content.data.length);
        request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'PUT',
            headers: { "Authorization": getAuthHeader(user), "Content-Type": content.contentType },
            json: false,
            encoding: null,
            body: new Buffer(content.data, 'base64')
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
function list_files_scan(user, flagFolder, title) {
    const result = [];
    return new Promise((resolve, reject) => {
        return authorize(user)
            .then((success) => {
            return rest_list_files_scan(user, flagFolder, result, title, undefined);
        })
            .then((e) => {
            resolve(result);
        })
            .catch(() => {
            reject();
        });
    });
}
exports.list_files_scan = list_files_scan;
function list_objects_folder(user, id) {
    const result = [];
    const result_filtered = [];
    return new Promise((resolve, reject) => {
        return authorize(user)
            .then((success) => {
            return rest_list_object_folder(user, result, id, undefined);
        })
            .then((e) => {
            //resolve(result);
            _.each(_.groupBy(result.map((item) => {
                return {
                    id: item.id, title: item.title, mimeType: item.mimeType
                };
            }), 'mimeType'), (value, key) => {
                if (isValidMIME_Type(key)) {
                    result_filtered.push(...value);
                }
            });
            resolve(result_filtered);
        })
            .catch(() => {
            reject();
        });
    });
}
exports.list_objects_folder = list_objects_folder;
function list_files_metadata(user, headers) {
    return new Promise((resolve, reject) => {
        return Promise.all(headers.map((item) => {
            return rest_list_files_metadata(user, item);
        })).then((e) => resolve(e));
    });
}
exports.list_files_metadata = list_files_metadata;
function list_file_metadata(user, id) {
    return new Promise((resolve, reject) => {
        const va = { id: id };
        return rest_list_files_metadata(user, va).then((e) => {
            if (e) {
                resolve(e);
            }
            else {
                reject();
            }
        });
    });
}
exports.list_file_metadata = list_file_metadata;
function get_folder_by_path(user, path) {
    return new Promise((resolve, reject) => {
        return authorize(user)
            .then(() => {
        }).catch(() => reject());
    });
}
exports.get_folder_by_path = get_folder_by_path;
function file_download(user, id) {
    return new Promise((resolve, reject) => {
        return rest_file_download(user, id).then((e) => {
            if (e) {
                resolve(e);
            }
            else {
                reject();
            }
        });
    });
}
exports.file_download = file_download;
function file_upload(user, id, data) {
    return new Promise((resolve, reject) => {
        data.id = id;
        return rest_file_upload(user, data).then((e) => {
            if (e) {
                resolve(e);
            }
            else {
                reject();
            }
        });
    });
}
exports.file_upload = file_upload;
function rest_folder_shieldox_register(user, id) {
    return new Promise((resolve, reject) => {
        console.log('folder id: ' + id);
        request({
            url: helpacc_1.SHIELDOX_BASE_URL + '/account/CreateFolder',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
            },
            json: {
                parentId: user.account.account.objectId,
                folderId: id,
                name: 'cloud'
            }
        }, (error, response, body) => {
            if (SUCCEEDED(error, response)) {
                resolve(body.objectId);
            }
            else {
                reject();
            }
        });
    });
}
exports.rest_folder_shieldox_register = rest_folder_shieldox_register;
function rest_file_shieldox_protect(user, args) {
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
                reject();
            }
        });
    });
}
exports.rest_file_shieldox_protect = rest_file_shieldox_protect;
function protect(user, id, color) {
    var file;
    var buffer;
    var vargs;
    var folderId;
    return new Promise((resolve, reject) => {
        return authorize(user)
            .then(() => list_file_metadata(user, id))
            .then((e) => {
            file = e;
            return rest_folder_shieldox_register(user, file.parents[0].id);
        })
            .then((e) => {
            folderId = e;
            return file_download(user, id);
        })
            .then((e) => {
            buffer = e;
            vargs = {
                date: Date.parse(file.modifiedDate),
                path: file.title,
                color: color,
                cloudKey: file.id,
                dirty: false,
                objectId: '',
                protect: true,
                folderId: folderId,
                data: buffer.data,
            };
            return rest_file_shieldox_protect(user, vargs);
        })
            .then((e) => {
            if (!e.dirty) {
                resolve({ color: e.color });
            }
            else {
                vargs.objectId = e.objectId;
                buffer.data = e.data;
                return file_upload(user, id, buffer);
            }
        })
            .then((e) => {
            if (!e) {
                reject();
            }
            else {
                resolve({ color: vargs.color });
            }
        })
            .catch(() => reject());
    });
}
exports.protect = protect;
