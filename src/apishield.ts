import * as FIELD  from './constant';

import {ILoginInfo} from './constant';

import {IDecryptArgs} from './constant';
import {IConvertArgs} from './constant';

import {SHIELDOX_BASE_URL} from './helpacc'

const request = require('request');

import * as  JSONStream from 'JSONStream';
import * as stream from 'stream';
import * as  es from     'event-stream';

export interface IShieldFolderSyncRef{
    parentId: string; // account objectId
    folderId: string;
    name:     string;
}

export interface IShieldFolderColorSyncRef{
    objectId: string;
    color: number
}

export interface IShieldFolder{
    parentId: string; // account objectId
    objectId: string;
    folderId: string;
    name:     string;
    color:    number;
}

export interface IShieldContact{
    email: string;
    name: string;
    objectId: string
}

export interface IShieldoxIOProtectArgs{
    dirty:    boolean;
    color:    number;
    objectId: string;
    data:     string;
    protect:  boolean;
    date:     number;
    path:     string;
    cloudKey: string;
    folderId: string;
    size:     number;
}

export interface IShieldPathPermissions{
    folders:   IShieldPathPermission[];
    documents: IShieldPathPermission[];
}

export interface IShieldPathPermission{
    path:       string;
    cloudKey:   string;
    color:      number;
    hasmenu:    boolean;
}

export interface IShieldColorResponse
{
    cloudKey:   string;
    objectId:   string;
    color:      number;
    colors:     number[];    
}

export interface IProtectResult{
    color: number;
}

export interface IShieldFolderScopeRef{
    objectId : string;
    scope: IShieldPolicyScopeInfo;
}


export interface IShieldPolicyScopeInfo {
    fautoscope: boolean;
    scope:      IShieldPolicyScope; 
}

export interface IShieldPolicyScope{
    groups:   any;
    contacts: any;
}

export interface IShieldMemberCredentials{
    enabled: boolean;
    canedit: boolean;
}

export function SUCCEEDED(error: any, response: any): boolean {
    if (null == response || typeof response == 'undefined') {
        return false;
    }
    var code = response.statusCode;
    if (typeof code == 'number') {
        return ((code >= 200) && (code < 300));
    }
    return false;
}

export function syncFolder(user: ILoginInfo, id: string, name: string): Promise<IShieldFolder>{
     return new Promise((resolve,reject)=>{
        const params : IShieldFolderSyncRef = {
            parentId: user.account.account.objectId,
            folderId: id,
            name: name
        };
        request({
             url: SHIELDOX_BASE_URL + '/account/CreateFolder', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId":  user.account.account.key,
                 "sldx_accType": 2
                },
             json: params
        },(error: any, response: any, body: IShieldFolder)=>{
            if(SUCCEEDED(error,response)){
                resolve(body);
            }else{
                reject();
            }
        });
    });
}

export function colorFolder(user: ILoginInfo, params: IShieldFolderColorSyncRef): Promise<IShieldFolder>{
     return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/account/color', 
             method: 'PUT',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId":  user.account.account.key,
                 "sldx_accType": 2
                },
             json: params
        },(error: any, response: any, body: IShieldFolder)=>{
            if(SUCCEEDED(error,response)){
                resolve(body);
            }else{
                reject();
            }
        });
    });
}

export function syncContact(user: ILoginInfo, params: IShieldContact): Promise<IShieldContact>{
     return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/contact/sync', 
             method: 'POST',
             headers: {
                 "Authorization" : 'Basic ' + user.token.access_token,
                 "sldx_accId"    :  user.account.account.key,
                 "sldx_accType"  : 2
                },
             json: params
        },(error: any, response: any, body: IShieldContact)=>{
            if(SUCCEEDED(error,response)){
                resolve(body);
            }else{
                reject();
            }
        });
    });
}

export function syncContactPromiseResolve(user: ILoginInfo,email: string, name: string): Promise<IShieldContact>{
    return new Promise((resolve,reject)=>{
        const params:  IShieldContact  = {email: email,  name: name, objectId: ''};
        return syncContact(user,params)
        .then((e)=>resolve(e))
        .catch(()=>resolve({email: 'undefined', name: 'undefined', objectId: 'undefined'}));
    });
}

export function lock(user: ILoginInfo, args: IShieldoxIOProtectArgs): Promise<IShieldoxIOProtectArgs>{
    return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/meta/lock', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId"   : user.account.account.key,
                 "sldx_accType" : 2
                },
             time:     true,
             json: args
        },(error: any, response: any, body: IShieldoxIOProtectArgs)=>{
            if (response){
                console.log('LOCK RESPONSE: ' + response.statusCode);
            }
            if(SUCCEEDED(error,response)){
                if (!body || typeof body.objectId != 'string' || body.objectId.length == 0 ){
                    reject(500);
                }else{
                    resolve(body);
                }
            }else{
                reject(500);
            }
        });
    });
}

export function decrypt(user: ILoginInfo, args: IDecryptArgs): Promise<IDecryptArgs>{
    return new Promise((resolve,reject)=>{
       
        request({
             url: SHIELDOX_BASE_URL + '/meta/decrypt', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId"   : user.account.account.key,
                 "sldx_accType" : 2
                },
             time:     true,
             json: args
        },(error: any, response: any, body: IDecryptArgs)=>{
            if(SUCCEEDED(error,response)){
                if (!body || !body.data){
                    reject(500);
                }else{
                    resolve(body);
                }
            }else{
                reject(500);
            }
        });
    });
}

export function obj2pdf(user: ILoginInfo, args: IConvertArgs): Promise<IDecryptArgs>{
    return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/service/obj2pdf', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId"   : user.account.account.key,
                 "sldx_accType" : 2//,
                },
             time:     true,
             json: args
        },(error: any, response: any, body: IConvertArgs)=>{
            if(SUCCEEDED(error,response)){
                if (!body){
                    reject(500);
                }else{
                    resolve(body.data);
                }
            }else{
                reject(500);
            }
        });
    });
}

export function options(user: ILoginInfo, args: any): Promise<IShieldPathPermissions>{
    return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/meta/getoptions', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId": user.account.account.key,
                 "sldx_accType": 2
                },
             json: args

        },(error: any, response: any, body: IShieldPathPermissions)=>{
            if(SUCCEEDED(error,response)){
                resolve(body);
            }else{
                reject();
            }
        });
    });
}

export function calcColor(user: ILoginInfo, cloudKey: string) : Promise<number>{
    return new Promise((resolve, reject) => {
        request({
            url: SHIELDOX_BASE_URL + '/meta/getoptions',
            method: 'POST',
            headers: {
                "Authorization": 'Basic ' + user.token.access_token,
                "sldx_accId": user.account.account.key,
                "sldx_accType": 2
            },
            json: {
                folders: [],
                documents: [{
                    cloudKey: cloudKey
                }]
            }
        }, (error: any, response: any, body: IShieldPathPermissions) => {
            if (SUCCEEDED(error, response)) {
                resolve(body.documents[0].color);
            } else {
                reject();
            }
        });
    });

}

export function scopeFolder(user: ILoginInfo, scope: IShieldFolderScopeRef): Promise<IShieldFolder>{
    return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/account/scope', 
             method: 'PUT',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId":  user.account.account.key,
                 "sldx_accType": 2
                },
             json: scope
        },(error: any, response: any, body: IShieldFolder)=>{
            if(SUCCEEDED(error,response)){
                resolve(body);
            }else{
                resolve(500);
            }
        });
    });
}

export function scopeDocument(user: ILoginInfo, objectId: string, scope: IShieldPolicyScope): Promise<number>{
    return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/documents/scope', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId":  user.account.account.key,
                 "sldx_accType": 2
                },
             json: {
                 objectId: objectId,
                 scope: scope
             }
        },(error: any, response: any, body: number)=>{
            if(SUCCEEDED(error,response)){
                resolve(200);
            }else{
                
                resolve(200);
            }
        });
    });
}


