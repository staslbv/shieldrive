"use strict";
const request = require('request');
const _ = require('underscore');
const constant_1 = require("../constant");
const stream = require("stream");
const odata = '@odata.nextLink';
const ONE_DRIVE_URL = 'https://graph.microsoft.com/v1.0';
function SUCCEEDED(url, error, response, body) {
    const code = SUCCESS(url, error, response, body);
    return (code >= 200 && code < 300);
}
function SUCCESS(url, error, response, body) {
    var code = 500;
    if (null == response || typeof response == 'undefined') {
        console.log('request error: NO RESPONSE');
    }
    else {
        code = response.statusCode;
    }
    console.log('[' + code + '] : ' + url);
    return code;
}
function isValidMIME_Type(mime, name) {
    const values = [
        'application/vnd.google-apps.folder',
        'office',
        'msword',
        'ms-excel',
        'ms-powerpoint',
        'officedocument.spreadsheetml',
        'wordprocessingml.document',
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
    // application/octet-stream
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
function ToIGFile(obj) {
    var e = {
        id: undefined,
        title: undefined,
        fileExtension: undefined,
        md5Checksum: undefined,
        mimeType: undefined,
        createdDate: undefined,
        modifiedDate: undefined,
        userPermission: undefined,
        parents: undefined,
        fileSize: undefined,
        shared: undefined
    };
    e.id = obj.id;
    e.title = obj.name;
    e.modifiedDate = obj.fileSystemInfo.lastModifiedDateTime;
    e.fileSize = obj.size;
    e.parents = [obj.parentReference];
    if (typeof obj.file != 'undefined' && _.isString(obj.file.mimeType)) {
        e.mimeType = obj.file.mimeType;
    }
    if (typeof obj.folder != 'undefined') {
        e.mimeType = 'application/vnd.google-apps.folder';
    }
    return e;
}
exports.ToIGFile = ToIGFile;
function rest_list_files_metadata(user, item, pretry) {
    return new Promise((resolve, reject) => {
        var result = undefined;
        var url = '/drive/items/' + item.id;
        request({
            url: ONE_DRIVE_URL + url,
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) },
            json: true
        }, (error, response, body) => {
            var statusCode = SUCCESS('rest_list_files_metadata', error, response, body);
            if (statusCode >= 200 && statusCode < 300) {
                if (pretry) {
                    pretry.completed = true;
                    pretry.body = body;
                }
                resolve(ToIGFile(body));
            }
            else if (statusCode == 500 || statusCode == 429 || statusCode == 503 || statusCode == 509) {
                if (!pretry) {
                    pretry = new constant_1.ICountArg();
                }
                if (pretry.count < 0) {
                    if (pretry.completed) {
                        resolve(ToIGFile(pretry.body));
                    }
                    else {
                        reject(statusCode);
                    }
                }
                else {
                    return new Promise((a, b) => {
                        setTimeout(() => {
                            a((pretry.count -= 1));
                        }, pretry.sleep);
                    }).then(() => resolve(rest_list_files_metadata(user, item, pretry)));
                }
            }
            else {
                reject(statusCode);
            }
        });
    });
}
function rest_file_contacts(user, id, pretry) {
    return new Promise((resolve, reject) => {
        const url = '/drive/items/' + id + '/permissions';
        request({
            url: ONE_DRIVE_URL + url,
            method: 'GET',
            headers: { "Authorization": getAuthHeader(user) },
            json: true
        }, (error, response, body) => {
            const buffer = [];
            const result = [];
            var statusCode = SUCCESS('rest_file_contacts', error, response, body);
            if (statusCode >= 200 && statusCode < 300) {
                console.log('begin debugging contacts ....');
                if (typeof body.value != 'undefined') {
                    body.value.forEach((e) => {
                        if (typeof e.invitation == 'object' && _.isString(e.invitation.email)) {
                            let email = e.invitation.email;
                            let name = '';
                            if (typeof e.grantedTo == 'object' &&
                                typeof e.grantedTo.user == 'object' &&
                                _.isString(e.grantedTo.user.displayName)) {
                                name = e.grantedTo.user.displayName;
                            }
                            buffer.push({ emailAddress: email, name: name, role: e.roles[0] });
                        } /*else if (typeof e.grantedTo     == 'undefined' &&
                                  typeof e.invitation    == 'undefined'){
                                      if (typeof e.roles == 'object' && e.roles.length > 0){
                                          if (e.roles[0] == 'write' || e.roles[0]== 'sp.owner'){
                                               buffer.push({emailAddress: user.account.account.key, name: '',role: 'owner'});
                                          }
                                      }
                                  } */
                    });
                    result.push({ emailAddress: user.account.account.key, name: '', role: 'owner' });
                    _.each(_.groupBy(buffer, 'emailAddress'), (value, key) => {
                        result.push(value[0]);
                    });
                }
                if (pretry) {
                    pretry.completed = true;
                    pretry.body = result;
                }
                console.log('end debugging contacts ....');
                console.log(JSON.stringify(result, null, 4));
                resolve(result);
            }
            else if (statusCode == 500 || statusCode == 403) {
                if (!pretry) {
                    pretry = new constant_1.ICountArg();
                }
                if (pretry.count < 0) {
                    if (pretry.completed) {
                        resolve(pretry.body);
                    }
                    else {
                        reject(statusCode);
                    }
                }
                else {
                    return new Promise((a, b) => {
                        setTimeout(() => {
                            a((pretry.count -= 1));
                        }, pretry.sleep);
                    }).then(() => resolve(rest_file_contacts(user, id, pretry)));
                }
            }
            else {
                reject();
            }
        });
    });
}
exports.rest_file_contacts = rest_file_contacts;
function rest_list_object_folder(user, buffer, rid, token) {
    return new Promise((resolve, reject) => {
        var url = '/drive/items/' + rid + '/children';
        if (token && typeof token == 'string' && token.length > 0) {
            url = token;
        }
        request({
            url: ONE_DRIVE_URL + url,
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) }, json: true
        }, (error, response, body) => {
            if (SUCCEEDED('rest_list_object_folder', error, response, body) && body && body.value) {
                body.value.forEach((e) => {
                    let obj = ToIGFile(e);
                    if (isValidMIME_Type(obj.mimeType, obj.title)) {
                        buffer.push(obj);
                    }
                });
                let nextPageToken = body[odata];
                if (body.value.length == 0 || typeof nextPageToken != 'string') {
                    resolve(body);
                }
                else {
                    resolve(rest_list_object_folder(user, buffer, rid, nextPageToken));
                }
            }
            else {
                reject();
            }
        });
    });
}
function rest_file_upload(user, content, pretry) {
    return new Promise((resolve, reject) => {
        const url = '/drive/items/' + content.id + '/content';
        const bufferStream = new stream.PassThrough();
        bufferStream.end(new Buffer(content.data, 'base64'));
        bufferStream.pipe(request({
            url: ONE_DRIVE_URL + url,
            method: 'PUT',
            headers: { "Authorization": getAuthHeader(user) /*, "Content-Type": content.contentType */ },
            json: false,
            encoding: null,
            timeout: 300000,
            time: true
        }, (error, response, body) => {
            var statusCode = SUCCESS('rest_file_upload', error, response, body);
            if (statusCode >= 200 && statusCode < 300) {
                if (pretry) {
                    pretry.completed = true;
                    pretry.body = true;
                }
                console.log('ULOAD ELLAPSED: [' + response.elapsedTime + ' ] ms.');
                resolve(true);
            }
            else if (statusCode == 500 || statusCode == 429 || statusCode == 503 || statusCode == 509) {
                if (!pretry) {
                    pretry = new constant_1.ICountArg();
                }
                if (pretry.count < 0) {
                    if (pretry.completed) {
                        resolve(true);
                    }
                    else {
                        reject(statusCode);
                    }
                }
                else {
                    return new Promise((a, b) => {
                        setTimeout(() => {
                            a((pretry.count -= 1));
                        }, pretry.sleep);
                    }).then(() => resolve(rest_file_upload(user, content, pretry)));
                }
            }
            else {
                reject();
            }
        }));
    });
}
function rest_file_download(user, id, pretry) {
    return new Promise((resolve, reject) => {
        request({
            url: ONE_DRIVE_URL + '/drive/items/' + id + '/content',
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) },
            json: false,
            timeout: 300000,
            encoding: null
        }, (error, response, body) => {
            var statusCode = SUCCESS('rest_file_download', error, response, body);
            if (statusCode >= 200 && statusCode < 300) {
                var result = { id: id, contentType: response.headers['content-type'], data: body.toString('base64') };
                if (pretry) {
                    pretry.completed = true;
                    pretry.body = result;
                }
                resolve(result);
            }
            else if (statusCode == 500 || statusCode == 429 || statusCode == 503 || statusCode == 509) {
                if (!pretry) {
                    pretry = new constant_1.ICountArg();
                }
                if (pretry.count < 0) {
                    if (pretry.completed) {
                        resolve(pretry.body);
                    }
                    else {
                        reject(statusCode);
                    }
                }
                else {
                    return new Promise((a, b) => {
                        setTimeout(() => {
                            a((pretry.count -= 1));
                        }, pretry.sleep);
                    }).then(() => resolve(rest_file_download(user, id, pretry)));
                }
            }
            else {
                reject();
            }
        });
    });
}
function list_files_metadata(user, headers) {
    return new Promise((resolve, reject) => {
        return Promise.all(headers.map((item) => {
            return rest_list_files_metadata(user, item);
        })).then((e) => resolve(e)).catch((e) => reject());
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
        }).catch((e) => {
            reject(e);
        });
    });
}
exports.list_file_metadata = list_file_metadata;
function list_objects_folder(user, id) {
    const result = [];
    const result_filtered = [];
    return new Promise((resolve, reject) => {
        return authorize(user)
            .then((success) => {
            return rest_list_object_folder(user, result, id, undefined);
        })
            .then((e) => {
            _.each(_.groupBy(result.map((item) => {
                return {
                    id: item.id, title: item.title, mimeType: item.mimeType
                };
            }), 'mimeType'), (value, key) => {
                result_filtered.push(...value);
            });
            resolve(result_filtered);
        })
            .catch(() => {
            reject();
        });
    });
}
exports.list_objects_folder = list_objects_folder;
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
//# sourceMappingURL=onedrive.js.map