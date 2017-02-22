"use strict";
const request = require("request");
const TOKEN = '1aIwKb6WujkAAAAAAAAZr-_vIGzcZ8x2OVKp1aKichvkbDmy4M6Ka8_uWk8GArRd';
const URL1 = 'https://api.dropboxapi.com/2';
const URL2 = 'https://content.dropboxapi.com/2';
function getAuthHeader() {
    return 'Bearer ' + TOKEN;
}
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
function get_metadata(path) {
    return new Promise((resolve, reject) => {
        request({
            url: URL1 + '/files/get_metadata',
            method: 'POST',
            headers: {
                Authorization: getAuthHeader()
            },
            json: {
                path: path,
                include_has_explicit_shared_members: true
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
exports.get_metadata = get_metadata;
function list_folder(path) {
    return new Promise((resolve, reject) => {
        request({
            url: URL1 + '/files/list_folder',
            method: 'POST',
            headers: {
                Authorization: getAuthHeader()
            },
            json: {
                path: path,
                recursive: false
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
exports.list_folder = list_folder;
function download(body) {
    return new Promise((resolve, reject) => {
        request({
            url: URL2 + '/files/download',
            method: 'POST',
            headers: {
                "Authorization": getAuthHeader(),
                "Dropbox-API-Arg": JSON.stringify({ path: body.path })
            }, json: false,
            encoding: null
        }, (error, response, z) => {
            if (!SUCCEEDED(error, response) || response.headers['content-type'] != 'application/octet-stream') {
                reject();
            }
            else {
                console.log('downloaded .....');
                resolve(z.toString('base64'));
            }
        });
    });
}
exports.download = download;
function upload(body) {
    return new Promise((resolve, reject) => {
        request({
            url: URL2 + '/files/upload',
            method: 'POST',
            headers: {
                "Authorization": getAuthHeader(),
                "Dropbox-API-Arg": JSON.stringify({
                    path: body.path,
                    mode: {
                        ['.tag']: 'update',
                        update: body.rev
                    },
                    mute: true
                }),
                "Content-Type": "application/octet-stream"
            }, json: false,
            encoding: null,
            body: new Buffer(body.data, 'base64')
        }, (error, response, z) => {
            if (!SUCCEEDED(error, response)) {
                reject();
            }
            else {
                resolve(response.statusCode);
            }
        });
    });
}
exports.upload = upload;
function sync_item(item) {
    return new Promise((resolve, reject) => {
        const tag = item['.tag'];
        if (tag != 'file') {
            resolve();
        }
        else {
            const name = item['path_lower'];
            console.log('stand by : ' + name);
            download({
                path: name
            })
                .then((e) => {
                console.log('downloaded ... : ' + name);
                resolve(e);
            })
                .catch((e) => {
                resolve();
            });
        }
    });
}
exports.sync_item = sync_item;
function sync_folder(path) {
    return new Promise((resolve, reject) => {
        return list_folder(path)
            .then((items) => {
            return Promise.all(items.entries.map((item) => {
                return sync_item(item);
            }).then((data) => {
            }, (error) => {
            }));
        })
            .catch((error) => {
            reject();
        });
    });
}
exports.sync_folder = sync_folder;
function sync_folder2(path) {
    return list_folder(path).then((items) => {
        return Promise.all(items.entries.map((item) => {
            return sync_item(item);
        }));
    }).then(() => {
        console.log('ACCEPTED AND FINISHED');
    }).catch((e) => {
        console.log('some error had occured ...');
    });
}
exports.sync_folder2 = sync_folder2;
