"use strict";
const URL = require("url");
class CUrlHost {
    constructor(db, value) {
        this.db = db;
        this.db = db;
        this.host = value;
    }
    // 
    get result() {
        return this.m_host;
    }
    set result(value) {
        this.m_host = value;
    }
    sync() {
        return new Promise((resolve, reject) => {
            return this.syncThis()
                .then((e) => {
                this.id = e.id;
                this.host = e.host;
                resolve(this.result = e);
            })
                .catch(() => {
                reject();
            });
        });
    }
    syncThis() {
        return new Promise((resolve, reject) => {
            return this.db.preco_host.getObject(this.host)
                .then((e) => {
                resolve(e);
            }, () => {
                return this.db.preco_host.createObject(this.host)
                    .then((e) => {
                    resolve(e);
                }, () => {
                    reject();
                });
            });
        });
    }
}
exports.CUrlHost = CUrlHost;
class CUrlPath {
    constructor(db, url, value) {
        this.db = db;
        this.url = url;
        this.db = db;
        this.url = url;
        this.pathname = decodeURIComponent(value);
    }
    // 
    get result() {
        return this.m_host;
    }
    set result(value) {
        this.m_host = value;
    }
    sync() {
        return new Promise((resolve, reject) => {
            return this.syncThis()
                .then((e) => {
                this.id = e.id;
                this.precoHostId = e.precoHostId;
                this.pathname = e.pathname;
                resolve(this.result = e);
            })
                .catch(() => {
                reject();
            });
        });
    }
    syncThis() {
        return new Promise((resolve, reject) => {
            return this.db.preco_path.getObject(this.url, this.pathname)
                .then((e) => {
                resolve(e);
            }, () => {
                return this.db.preco_path.createObject(this.url, this.pathname)
                    .then((e) => {
                    resolve(e);
                }, () => {
                    reject();
                });
            });
        });
    }
}
exports.CUrlPath = CUrlPath;
function registerUrl(db, url) {
    return new Promise((resolve, reject) => {
        var host = new CUrlHost(db, URL.parse(url).host);
        var path = new CUrlPath(db, host, URL.parse(url).pathname);
        return host.sync().then((e) => {
            return path.sync().then((e) => {
                resolve({ host: host.result, path: path.result });
            });
        }).catch(() => reject());
    });
}
exports.registerUrl = registerUrl;
