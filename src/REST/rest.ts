import express    = require('express');
import parserBody = require('body-parser');
import _          = require('underscore');
import dropbox    = require('./dropbox');

import {CDb} from '../DATABASE/db';

import middleware =  require('../middleware');

import * as acchelp from '../helpacc';

export class CRest{
    app:               express;
    PORT:              number;
    static pData:      CDb;
   
    Listen(port: number): Promise<boolean>{
         this.PORT = port;
         return new Promise<boolean>((resolve,reject)=>{
             this.app.listen(port,()=>{
                 console.log('server listens on port: ' + port);
                 resolve();});
         });
    }
    static requireAuthorization(req,res,next){
     acchelp.authorize(CRest.pData,req.get('Authorization'), req.get('sldx_accId') )
			.then((e)=>{
                req.user = e;
				next();
			})
			.catch((e)=>{
				return res.status(401).send();
			});
    }

    allowCrossDomain (req, res, next) {
       res.header('Access-Control-Allow-Origin', '*');
       res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE');
       res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization','sldx_accId');
       if ('OPTIONS' == req.method) {
          res.send(200);
       }
       else {
         next();
       }
    }

    Init(): void
    {
        this.app.use(this.allowCrossDomain);

        this.app.post('/user',(req,res)=>{
            acchelp.registerUser(CRest.pData,req.body)
            .then((e)=>{
                res.json(e);
            })
            .catch(()=>{
                return res.status(500).send();
            });
        });

        this.app.post('/user/account',(req,res)=>{
            acchelp.registerAccount(CRest.pData,req.body.user,req.body.account)
            .then((e)=>{
                res.json(e);
            })
            .catch(()=>{
                return res.status(500).send();
            });
        });

        this.app.post('/user/account/token',(req,res)=>{
            acchelp.registerTokenAccount(CRest.pData,req.body.user,req.body.account,req.body.token)
            .then((e)=>{
                res.json(e);
            })
            .catch(()=>{
                return res.status(500).send();
            });
        });

        this.app.post('/user/account/shieldox',(req,res)=>{
            acchelp.registerShieldTokenAccount(CRest.pData,req.body.user,req.body.account,req.body.token)
            .then((e)=>{
                res.setHeader('Authorization',e.authorization);
                res.json(e.account);
            })
            .catch(()=>{
                return res.status(500).send();
            });
        });

        this.app.get('/login', CRest.requireAuthorization, (req,res)=>{
            res.json(req.user);
        });
    
        this.app.post('/list_folder',(req,res)=>{
            dropbox.sync_folder(req.body.path).then((resolve)=>{
                res.json(resolve);
            },(reject)=>{
                return res.status(500).send();
            });
        });
         this.app.post('/get_metadata',(req,res)=>{
            dropbox.get_metadata(req.body.path).then((resolve)=>{
                res.json(resolve);
            },(reject)=>{
                return res.status(500).send();
            });
        });
        this.app.post('/download',(req,res)=>{
            dropbox.download(req.body).then((resolve)=>{
                 res.json({data: resolve});
            },(reject)=>{
                return res.status(500).send();
            });
        });
        this.app.post('/upload',(req,res)=>{
            dropbox.get_metadata(req.body.path).then((resolve)=>{
                req.body.rev = resolve.rev;
                console.log('rev: ' + req.body.rev);
                return dropbox.upload(req.body);
            }).then((e)=>{res.json(e);})
            .catch((e)=>{ return res.status(500).send();});
        });

    }

    constructor(){
        this.app  = express();
        this.app.use(parserBody.json());
    }
}