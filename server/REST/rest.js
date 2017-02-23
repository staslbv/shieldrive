"use strict";
const express = require("express");
const parserBody = require("body-parser");
const _ = require("underscore");
const dropbox = require("./dropbox");
const gdrive = require("./gdrive");
const acchelp = require("../helpacc");
class CRest {
    Listen(port) {
        this.PORT = port;
        return new Promise((resolve, reject) => {
            this.app.listen(port, () => {
                console.log('server listens on port: ' + port);
                resolve();
            });
        });
    }
    static requireAuthorization(req, res, next) {
        acchelp.authorize(CRest.pData, req.get('Authorization'), req.get('sldx_accId'))
            .then((e) => {
            req.user = e;
            next();
        })
            .catch((e) => {
            return res.status(401).send();
        });
    }
    allowCrossDomain(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization', 'sldx_accId');
        if ('OPTIONS' == req.method) {
            return res.send(200);
        }
        else {
            next();
        }
    }
    Init() {
        this.app.use(this.allowCrossDomain);
        this.app.post('/user', (req, res) => {
            acchelp.registerUser(CRest.pData, req.body)
                .then((e) => {
                res.json(e);
            })
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.post('/user/account', (req, res) => {
            acchelp.registerAccount(CRest.pData, req.body.user, req.body.account)
                .then((e) => {
                res.json(e);
            })
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.post('/user/account/token', (req, res) => {
            acchelp.registerTokenAccount(CRest.pData, req.body.user, req.body.account, req.body.token)
                .then((e) => {
                res.json(e);
            })
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.post('/user/account/shieldox', (req, res) => {
            acchelp.registerShieldTokenAccount(CRest.pData, req.body.user, req.body.account, req.body.token)
                .then((e) => {
                res.setHeader('Authorization', e.authorization);
                res.json(e.account);
            })
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/login', CRest.requireAuthorization, (req, res) => {
            res.json(req.user);
        });
        this.app.get('/cloud/file', CRest.requireAuthorization, (req, res) => {
            gdrive.list_files_scan(req.user, false, req.query.title)
                .then((e) => res.json(_.groupBy(e.map((item) => {
                const p = (item.parents && item.parents.length > 0 ? item.parents[0].id : 'ROOT');
                return { id: item.id, title: item.title, parent: p };
            }), 'parent')))
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/cloud/folder', CRest.requireAuthorization, (req, res) => {
            gdrive.list_files_scan(req.user, true, req.query.title)
                .then((e) => res.json(_.groupBy(e.map((item) => {
                const p = (item.parents && item.parents.length > 0 ? item.parents[0].id : 'ROOT');
                return { id: item.id, title: item.title, parent: p };
            }), 'parent')))
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/cloud/list/:id', CRest.requireAuthorization, (req, res) => {
            gdrive.list_objects_folder(req.user, req.params.id)
                .then((e) => res.json(_.groupBy(e, 'mimeType')))
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/cloud/metadata/:id', CRest.requireAuthorization, (req, res) => {
            gdrive.list_file_metadata(req.user, req.params.id)
                .then((e) => res.json(e))
                .catch(() => { return res.status(500).send(); });
        });
        this.app.get('/cloud/file/content/:id', CRest.requireAuthorization, (req, res) => {
            gdrive.file_download(req.user, req.params.id)
                .then((e) => res.json({ data: e }))
                .catch(() => { return res.status(500).send(); });
        });
        this.app.post('/cloud/file/content/:id', CRest.requireAuthorization, (req, res) => {
            gdrive.file_upload(req.user, req.params.id, req.body)
                .then((e) => res.json({ succeed: e }))
                .catch(() => { return res.status(500).send(); });
        });
        this.app.get('/cloud/file/:id/protect/:color', CRest.requireAuthorization, (req, res) => {
            gdrive.protect(req.user, req.params.id, parseInt(req.params.color))
                .then((e) => res.json(e))
                .catch(() => { return res.status(500).send(); });
        });
        this.app.get('/oauth2callback', (req, res) => {
            return res.status(200).send();
        });
        this.app.post('/list_folder', (req, res) => {
            dropbox.sync_folder(req.body.path).then((resolve) => {
                res.json(resolve);
            }, (reject) => {
                return res.status(500).send();
            });
        });
        this.app.post('/get_metadata', (req, res) => {
            dropbox.get_metadata(req.body.path).then((resolve) => {
                res.json(resolve);
            }, (reject) => {
                return res.status(500).send();
            });
        });
        this.app.post('/download', (req, res) => {
            dropbox.download(req.body).then((resolve) => {
                res.json({ data: resolve });
            }, (reject) => {
                return res.status(500).send();
            });
        });
        this.app.post('/upload', (req, res) => {
            dropbox.get_metadata(req.body.path).then((resolve) => {
                req.body.rev = resolve.rev;
                console.log('rev: ' + req.body.rev);
                return dropbox.upload(req.body);
            }).then((e) => { res.json(e); })
                .catch((e) => { return res.status(500).send(); });
        });
    }
    constructor() {
        this.app = express();
        this.app.use(parserBody.json());
    }
}
exports.CRest = CRest;
