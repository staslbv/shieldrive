/*
import {IUrlHost}     from './constant';
import {IUrlPath}     from './constant';
import {IUrlInfo}     from './constant';

import {CDb}          from './DATABASE/db';
import  *  as MODEL   from './constant';

import * as URL from 'url';

export class CUrlHost implements IUrlHost{
    // interface impl
    id:   number;
    host: string;
    // private
    private m_host:   IUrlHost;
    //
    get result(): IUrlHost{
        return this.m_host;
    }
    set result(value: IUrlHost) {
       this.m_host = value;
    }
    sync() : Promise<IUrlHost>{
        return new Promise((resolve,reject)=>{
            return this.syncThis()
            .then((e)=>{
                this.id   = e.id;
                this.host = e.host;
                resolve(this.result = e);
            })
            .catch(()=>{
                reject();
            });
        });
    }
    syncThis(): Promise<IUrlHost>{
        return new Promise((resolve,reject)=>{
            return this.db.preco_host.getObject(this.host)
            .then((e)=>{
                resolve(e);
            },()=>{
                return this.db.preco_host.createObject(this.host)
                .then((e)=>{
                    resolve(e);
                },()=>{
                    reject();
                });
            });
        });
    }
    constructor(private db: CDb, value: string){
        this.db   = db;
        this.host = value;
    }
}
export class CUrlPath implements IUrlPath{
    id:          number;
    precoHostId: number;
    pathname:    string;
    //
    private m_host:   IUrlPath;
    //
    get result(): IUrlPath{
        return this.m_host;
    }
    set result(value: IUrlPath) {
       this.m_host = value;
    }

    sync() : Promise<IUrlPath>{
        return new Promise((resolve,reject)=>{
            return this.syncThis()
            .then((e)=>{
                this.id          = e.id;
                this.precoHostId = e.precoHostId;
                this.pathname    = e.pathname;
                resolve(this.result = e);
            })
            .catch(()=>{
                reject();
            });
        });
    }
    syncThis(): Promise<IUrlPath>{
        return new Promise((resolve,reject)=>{
            return this.db.preco_path.getObject(this.url, this.pathname)
            .then((e)=>{
                resolve(e);
            },()=>{
                return this.db.preco_path.createObject(this.url, this.pathname)
                .then((e)=>{
                    resolve(e);
                },()=>{
                    reject();
                });
            });
        });
    }
    constructor(private db: CDb, private url: IUrlHost, value: string){
        this.db       = db;
        this.url      = url;
        this.pathname = decodeURIComponent(value);
    }
}

export function registerUrl(db: CDb, url: string): Promise<IUrlInfo> {
    return new Promise((resolve,reject)=>{
        var host =  new CUrlHost(db, URL.parse(url).host);
        var path =  new CUrlPath(db, host, URL.parse(url).pathname);
        return host.sync().then((e)=>{
            return path.sync().then((e)=>{
                resolve({ host: host.result, path: path.result});
            });
        }).catch(()=>reject());
    });

}

*/
