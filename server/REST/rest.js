"use strict";
const express = require("express");
const parserBody = require("body-parser");
const _ = require("underscore");
const gdrive = require("./gdrive");
const acchelp = require("../helpacc");
const worker = require("../worker/folder");
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
        }); // INameId
        this.app.post('/cloud/entity/id', CRest.requireAuthorization, (req, res) => {
            gdrive.rest_file_FindById(req.user, req.body)
                .then((e) => res.json(e))
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/cloud/file', CRest.requireAuthorization, (req, res) => {
            gdrive.list_files_scan(req.user, false, req.query.title)
                .then((e) => res.json(_.groupBy(e.map((item) => {
                const p = (item.parents && item.parents.length > 0 ? item.parents[0].id : 'root');
                return { id: item.id, title: item.title, parent: p };
            }), 'parent')))
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/cloud/folder', CRest.requireAuthorization, (req, res) => {
            gdrive.list_files_scan(req.user, true, req.query.title)
                .then((e) => res.json(_.groupBy(e.map((item) => {
                const p = (item.parents && item.parents.length > 0 ? item.parents[0].id : 'root');
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
        this.app.get('/cloud/folder/:id/options', CRest.requireAuthorization, (req, res) => {
            worker.getViewOptions(req.user, req.params.id)
                .then((e) => res.json(e))
                .catch(() => {
                return res.status(500).send();
            });
        });
        this.app.get('/cloud/file/:id/colors', CRest.requireAuthorization, (req, res) => {
            worker.colorUiLoadFile(req.user, req.params.id)
                .then((e) => res.json(e))
                .catch((code) => {
                return res.status(code).send();
            });
        });
        this.app.get('/cloud/folder/:id/colors', CRest.requireAuthorization, (req, res) => {
            worker.colorUiLoadFolder(req.user, req.params.id)
                .then((e) => res.json(e))
                .catch((code) => {
                return res.status(code).send();
            });
        });
        this.app.get('/cloud/contact/:id', CRest.requireAuthorization, (req, res) => {
            gdrive.rest_file_contacts(req.user, req.params.id)
                .then((e) => res.json(_.groupBy(e, 'role')))
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
            worker.protectFile(req.user, req.params.id, parseInt(req.params.color))
                .then((e) => res.json(e))
                .catch((e) => { return res.status(500).send(); });
        });
        this.app.get('/cloud/folder/:id/protect/:color', CRest.requireAuthorization, (req, res) => {
            worker.protectFolder(req.user, req.params.id, parseInt(req.params.color))
                .then((e) => res.json(e))
                .catch((e) => { return res.status(500).send(); });
        });
        this.app.get('/cloud/folder/:id/context/:color', CRest.requireAuthorization, (req, res) => {
            console.log('calculating context ...');
            worker.colorFolderGetContext(req.user, req.params.id, parseInt(req.params.color))
                .then((e) => res.json(e))
                .catch((e) => { return res.status(e).send(); });
        });
        this.app.get('/oauth2callback', (req, res) => {
            return res.status(200).send();
        });
    }
    constructor() {
        this.app = express();
        this.app.use(parserBody.json());
    }
}
exports.CRest = CRest;
