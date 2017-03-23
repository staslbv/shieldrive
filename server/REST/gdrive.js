"use strict";
const request = require('request');
const _ = require('underscore');
const APISHIELD = require("../apishield");
const constant_1 = require("../constant");
const stream = require("stream");
;
;
;
exports.IGFile_FIELD = 'id,title,fileExtension,fileSize,owners,parents';
;
const GOOGLE_DRIVE_URL = 'https://www.googleapis.com';
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
            if (SUCCEEDED('rest_list_files_scan', error, response, body) && body && body.items) {
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
function rest_list_files_scan_rid(user, flagFolder, buffer, title, rid, token) {
    return new Promise((resolve, reject) => {
        var url = '/drive/v2/files?';
        const q_title = " and (title=\'" + title + "\')";
        const q_FOLDER = "q=" + encodeURIComponent("\'" + rid + "\' in parents and " + "(mimeType=\'application/vnd.google-apps.folder\')" + q_title);
        const q_FILE = "q=" + encodeURIComponent("\'" + rid + "\' in parents and " + "(mimeType contains \'office\' or mimeType contains \'msword\' or mimeType contains \'ms-excel\' or mimeType contains \'ms-powerpoint\' or mimeType contains \'application/pdf\' or mimeType contains \'application/x-pdf\' or mimeType contains \'application/vnd.pdf\' or mimeType contains \'application/acrobat\')" + q_title);
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
            if (SUCCEEDED('rest_list_files_scan_rid', error, response, body) && body && body.items) {
                buffer.push(...body.items);
                if (body.items.length == 0 || typeof body.nextPageToken != 'string' || body.nextPageToken.length == 0) {
                    resolve(body);
                }
                else {
                    resolve(rest_list_files_scan_rid(user, flagFolder, buffer, title, rid, body.nextPageToken));
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
        if (token && typeof token == 'string' && token.length > 0) {
            url += '&pageToken=' + token;
        }
        request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'GET',
            headers: { Authorization: getAuthHeader(user) }, json: true
        }, (error, response, body) => {
            if (SUCCEEDED('rest_list_object_folder', error, response, body) && body && body.items) {
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
function rest_list_files_metadata(user, item, pretry) {
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
            var statusCode = SUCCESS('rest_list_files_metadata', error, response, body);
            if (statusCode >= 200 && statusCode < 300) {
                if (pretry) {
                    pretry.completed = true;
                    pretry.body = body;
                }
                resolve(body);
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
                    }).then(() => resolve(rest_list_files_metadata(user, item, pretry)));
                }
            }
            else {
                reject(statusCode);
            }
        });
    });
}
function rest_file_FindById(user, nameId) {
    return new Promise((resolve, reject) => {
        return rest_list_files_metadata(user, { id: nameId.parentId })
            .then((e) => {
            const buffer = [];
            return rest_list_files_scan_rid(user, nameId.folder, buffer, nameId.childId, e.id, undefined).then((e) => {
                if (buffer.length > 0) {
                    resolve(buffer[0]);
                }
                else {
                    console.log('no results');
                    reject(404);
                }
            }).catch((e) => reject(e));
        })
            .catch((e) => reject(e));
    });
}
exports.rest_file_FindById = rest_file_FindById;
function rest_file_download(user, id, pretry) {
    return new Promise((resolve, reject) => {
        request({
            url: GOOGLE_DRIVE_URL + '/drive/v3/files/' + id + '?alt=media',
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
                    }).then(() => resolve(rest_file_download(user, id, pretry)));
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
        const url = '/upload/drive/v2/files/' + content.id + '?uploadType=media&newRevision=false&updateViewedDate=false';
        console.log(url + ' ' + content.data.length);
        const bufferStream = new stream.PassThrough();
        bufferStream.end(new Buffer(content.data, 'base64'));
        bufferStream.pipe(request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'PUT',
            headers: { "Authorization": getAuthHeader(user), "Content-Type": content.contentType },
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
            else if (statusCode == 500 || statusCode == 403) {
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
function rest_file_contacts(user, id, pretry) {
    return new Promise((resolve, reject) => {
        const url = '/drive/v2/files/' + id + '/permissions';
        request({
            url: GOOGLE_DRIVE_URL + url,
            method: 'GET',
            headers: { "Authorization": getAuthHeader(user) },
            json: true
        }, (error, response, body) => {
            const buffer = [];
            var statusCode = SUCCESS('rest_file_contacts', error, response, body);
            if (statusCode >= 200 && statusCode < 300) {
                body.items.forEach((item) => {
                    if (_.isString(item.emailAddress)) {
                        item.emailAddress = item.emailAddress.toLowerCase().trim();
                        if (item.emailAddress.length > 0) {
                            buffer.push({
                                emailAddress: item.emailAddress,
                                name: item.name,
                                role: item.role
                            });
                        }
                    }
                });
                if (pretry) {
                    pretry.completed = true;
                    pretry.body = buffer;
                }
                resolve(buffer);
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
function rest_file_preview(user, nameId) {
    var objFile = undefined;
    return new Promise((resolve, reject) => {
        return rest_file_FindById(user, nameId).then((e) => {
            objFile = e;
            return file_download(user, objFile.id).then((e) => {
                var dargs = {
                    data: e.data,
                    fileName: objFile.title
                };
                var input = {
                    data: {
                        fileName: objFile.title
                    }
                };
                return APISHIELD.decrypt(user, dargs).then((e) => {
                    input.data.data = e.data;
                    return APISHIELD.obj2pdf(user, input).then((e) => {
                        let result = e;
                        result.color = 1;
                        return APISHIELD.calcColor(user, objFile.id).then((c) => {
                            result.color = c;
                            resolve(result);
                        }).catch(() => {
                            resolve(result);
                        });
                    }).catch((e) => {
                        reject(e);
                    });
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        }).catch((e) => {
            reject(e);
        });
    });
}
exports.rest_file_preview = rest_file_preview;
