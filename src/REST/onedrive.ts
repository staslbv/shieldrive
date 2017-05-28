

import {IGFile} from './gdrive';
import {IGContact} from './gdrive';
import {IUsersPermissions} from './gdrive';
import {IGUserPermission} from './gdrive';
const  request = require('request');
const  _ = require('underscore');
import * as APISHIELD from '../apishield';
import * as FIELD from   '../constant';
import {ICountArg} from '../constant';
import {ILoginInfo} from '../constant';
import {IContentBuffer} from '../constant';
import {IDecryptArgs} from '../constant';
import {IProtectResult} from '../apishield';
import {IShieldoxIOProtectArgs} from '../apishield';
import {SHIELDOX_BASE_URL} from '../helpacc';

import * as stream from 'stream';

const odata: string = '@odata.nextLink';

export interface IOneDriveObject
{
    id:              string;
    name:            string;
    size:            number;
    file:            IOneDriveFileFace;
    folder:          IOneDriveFolderFace;
    fileSystemInfo:  IOneDriveFileSystemInfo;
    parentReference: IOneDriveParent;
}

export interface IOneDrivePageResponse
{
    value: IOneDriveObject[];
}

export interface IOneDriveFileFace
{
    mimeType: string;
}

export interface IOneDriveFolderFace
{
    childCount: number;
}

export interface IOneDriveParent
{
    driveId: string;
    id: string;
    name: string;
    path: string;
}

export interface IOneDrivePermissions
{
    value: IOneDrivePermission[];
}
export interface IOneDrivePermission
{
    id:            string;
    grantedTo:     IOneDriveGrantUser;
    invitation:    IOneDriveInvitation;
    roles:         string[];
    shareId:       string;
    inheritedFrom: any;
}
export interface IOneDriveGrantUser
{
    user:        IOneDriveUser;
}
export interface IOneDriveUser
{
    id:          string;
    displayName: string;
}
export interface IOneDriveInvitation
{
    email:       string;
}

export interface IOneDriveFileSystemInfo
{
    lastModifiedDateTime: string;
}



const ONE_DRIVE_URL : string = 'https://graph.microsoft.com/v1.0';

function SUCCEEDED(url: string, error: any, response: any, body: any): boolean{
    const code: number = SUCCESS(url, error,response,body);
    
    return (code >= 200 && code < 300);
}

function SUCCESS(url: string, error: any, response: any, body: any): number {
    var code: number = 500;
    if (null == response || typeof response == 'undefined') {
         console.log('request error: NO RESPONSE');
    }else{
         code = response.statusCode;
    }

    console.log('[' + code + '] : ' + url);
    
    return code;
}

function isValidMIME_Type(mime: string, name: string): boolean{
  const values : string[] = [
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
  if (mime && typeof mime == 'string' && mime.length > 0){
      mime = mime.toLowerCase();
      for(var i: number = 0; i < values.length; i ++){
          if (mime.indexOf(values[i]) >= 0){
              return true;
          }
      }
  }
  // application/octet-stream
  return false;
}

function getAuthHeader(user: ILoginInfo) : string{
    return user.account.token.token_type + ' ' + user.account.token.access_token;
}
function authorize(user: ILoginInfo): Promise<boolean>{
    return new Promise((resolve,reject)=>{
        resolve();
    });
}

export function ToIGFile(obj: any) : IGFile{ // IOneDriveObject
    var e: IGFile = {
         id :             undefined,
         title :          undefined,
         fileExtension :  undefined,
         md5Checksum :    undefined,
         mimeType :       undefined,
         createdDate :    undefined,
         modifiedDate :   undefined,
         userPermission : undefined,
         parents :        undefined,
         fileSize :       undefined,
         shared :         undefined
    };
    e.id           = obj.id;
    e.title        = obj.name;
    e.modifiedDate = obj.fileSystemInfo.lastModifiedDateTime;
    e.fileSize     = obj.size;
    e.parents      = [obj.parentReference];
    if (typeof obj.file != 'undefined' && _.isString(obj.file.mimeType)){
        e.mimeType = obj.file.mimeType;
    }
    if (typeof obj.folder != 'undefined'){
        e.mimeType ='application/vnd.google-apps.folder';
    }
    return e;
}

function rest_list_files_metadata(user: ILoginInfo, item: any, pretry? : ICountArg): Promise<IGFile>{
    return new Promise((resolve,reject)=>{
        var result: any = undefined;
        var url = '/drive/items/' + item.id;
        request({
            url: ONE_DRIVE_URL + url, 
            method: 'GET',
            headers: {Authorization: getAuthHeader(user)},
            json:true},
        (error: any, response: any, body: IGFile)=>{
            var statusCode = SUCCESS('rest_list_files_metadata', error,response,body);
            if (statusCode >= 200 && statusCode < 300){
                if (pretry){ 
                    pretry.completed = true; 
                    pretry.body      = body 
                }
                resolve(ToIGFile(body));
            }else if (statusCode == 500 || statusCode == 429|| statusCode == 503 || statusCode == 509){
                if (!pretry) { pretry = new ICountArg();}
                if (pretry.count < 0) {
                    if (pretry.completed){
                        resolve(ToIGFile(pretry.body));
                    }else{
                        reject(statusCode);
                    }
                } else {
                    return new Promise((a,b)=>{
                        setTimeout(()=>{
                            a((pretry.count-= 1));
                        },pretry.sleep);
                    }).then(()=> resolve(rest_list_files_metadata(user,item,pretry)));
                }
            }else{
               reject(statusCode);
            }
        });
    });
}

export function rest_file_contacts(user: ILoginInfo, id: string, pretry? : ICountArg): Promise<IGContact[]>{
    return new Promise((resolve,reject)=>{
        const url: string = '/drive/items/' + id + '/permissions'
       
        request({
             url: ONE_DRIVE_URL + url, 
             method: 'GET',
             headers: {"Authorization": getAuthHeader(user)},
             json: true
        },(error: any, response: any, body: IOneDrivePermissions)=>{
            const buffer: IGContact[] = [];
            const result: IGContact[] = [];
            var statusCode = SUCCESS('rest_file_contacts', error,response,body);
             if (statusCode >= 200 && statusCode < 300)
             {
                 console.log('begin debugging contacts ....');
                

                 if (typeof body.value != 'undefined'){
                     body.value.forEach((e)=>{
                         if (typeof e.invitation == 'object' && _.isString(e.invitation.email)){
                             let email: string = e.invitation.email;
                             let name: string  = '';
                             if (typeof e.grantedTo      == 'object' && 
                                 typeof e.grantedTo.user == 'object' &&
                                 _.isString(e.grantedTo.user.displayName)){
                                     name = e.grantedTo.user.displayName;
                                 }
                             buffer.push({emailAddress: email,name: name,role: e.roles[0]});
                         }/*else if (typeof e.grantedTo     == 'undefined' && 
                                   typeof e.invitation    == 'undefined'){
                                       if (typeof e.roles == 'object' && e.roles.length > 0){
                                           if (e.roles[0] == 'write' || e.roles[0]== 'sp.owner'){
                                                buffer.push({emailAddress: user.account.account.key, name: '',role: 'owner'});
                                           }
                                       }
                                   } */
                     });
                    
                    result.push({emailAddress: user.account.account.key, name: '',role: 'owner'});

                    _.each(_.groupBy(buffer,'emailAddress'),(value: IGContact[], key: string)=>{
                        result.push(value[0]);
                    });
                   
                   
                 }
                if (pretry){ 
                    pretry.completed = true; 
                    pretry.body      = result ; 
                }
                 console.log('end debugging contacts ....');
                 console.log(JSON.stringify(result,null,4));
                 resolve(result);
            }else if (statusCode == 500 || statusCode == 403){
                if (!pretry) { pretry = new ICountArg();}
                if (pretry.count < 0) {
                    if (pretry.completed){
                        resolve(pretry.body);
                    }else{
                        reject(statusCode);
                    }
                } else {
                    return new Promise((a,b)=>{
                        setTimeout(()=>{
                            a((pretry.count-= 1));
                        },pretry.sleep);
                    }).then(()=> resolve(rest_file_contacts(user,id,pretry)));
                }
            }else{
              reject();
            }
        });
    });
}


function rest_list_object_folder(user: ILoginInfo , buffer: IGFile[],  rid: string, token: string) : Promise<IOneDrivePageResponse>{
   return new Promise((resolve,reject)=>{
       var url = '/drive/items/' + rid + '/children';
       if (token && typeof token == 'string' && token.length > 0){
           url = token;
       } 
       request({
           url:    ONE_DRIVE_URL + url,
           method: 'GET',
           headers: { Authorization: getAuthHeader(user)}, json: true
       }, (error: any, response: any, body: IOneDrivePageResponse)=>{
           
           if (SUCCEEDED('rest_list_object_folder',error,response, body) && body && body.value){
               body.value.forEach((e)=>{
                  let obj = ToIGFile(e);
                  if (isValidMIME_Type(obj.mimeType,obj.title)){
                      buffer.push(obj);
                  }
               });
              
               let nextPageToken : any = body[odata];
               if (body.value.length == 0 || typeof nextPageToken != 'string'){     
                   resolve(body);
               }else{
                   resolve(rest_list_object_folder(user, buffer, rid, nextPageToken));
               }
           }else{
                reject();
           }
       });
   });
}

function rest_file_upload(user: ILoginInfo, content: IContentBuffer, pretry? : ICountArg): Promise<boolean>{
    return new Promise((resolve,reject)=>{
        const url: string = '/drive/items/' + content.id + '/content';
        const bufferStream : stream.PassThrough = new stream.PassThrough();
        bufferStream.end(new Buffer(content.data,'base64'));
        bufferStream.pipe(
        request({
             url:      ONE_DRIVE_URL + url, 
             method:  'PUT',
             headers:  {"Authorization": getAuthHeader(user)/*, "Content-Type": content.contentType */},
             json:     false,
             encoding: null,
             timeout:  300000,
             time:     true
        },(error: any, response: any, body: IGFile)=>{
            var statusCode = SUCCESS('rest_file_upload', error,response,body);
            if (statusCode >= 200 && statusCode < 300){
                if (pretry){ 
                    pretry.completed = true; 
                    pretry.body      = true; 
                }
                console.log('ULOAD ELLAPSED: [' + response.elapsedTime + ' ] ms.');
                resolve(true);
            }else if (statusCode == 500 || statusCode == 429|| statusCode == 503 || statusCode == 509){
                if (!pretry) { pretry = new ICountArg();}
                if (pretry.count < 0) {
                    if (pretry.completed){
                        resolve(true);
                    }else{
                        reject(statusCode);
                    }
                } else {
                    return new Promise((a,b)=>{
                        setTimeout(()=>{
                            a((pretry.count-= 1));
                        },pretry.sleep);
                    }).then(()=> resolve(rest_file_upload(user,content,pretry)));
                }
            }else{
               reject();
            }
        }));
    });
}

function rest_file_download(user: ILoginInfo, id: string, pretry? : ICountArg) : Promise<IContentBuffer>{
    return new Promise((resolve,reject)=>{
         request({
            url: ONE_DRIVE_URL + '/drive/items/' + id + '/content', 
            method: 'GET',
            headers: {Authorization: getAuthHeader(user)},
            json:false,
            timeout:  300000,
            encoding: null},
        (error: any, response: any, body: Buffer)=>{
             var statusCode = SUCCESS('rest_file_download', error,response,body);
            if (statusCode >= 200 && statusCode < 300){
                var result  = {id: id, contentType: response.headers['content-type'], data: body.toString('base64')};
                if (pretry){ 
                    pretry.completed = true;
                    pretry.body      = result; 
                }
                resolve(result);
            }else if (statusCode == 500 || statusCode == 429|| statusCode == 503 || statusCode == 509){
                if (!pretry) { pretry = new ICountArg();}
                if (pretry.count < 0) {
                    if (pretry.completed){
                        resolve(pretry.body);
                    }else{
                        reject(statusCode);
                    }
                } else {
                    return new Promise((a,b)=>{
                        setTimeout(()=>{
                            a((pretry.count-= 1));
                        },pretry.sleep);
                    }).then(()=> resolve(rest_file_download(user,id,pretry)));
                }
            }else{
              reject();
            }
        });
    });
} 


export function list_files_metadata(user: ILoginInfo, headers: IGFile[]) : Promise<IGFile[]>{
    return new Promise((resolve,reject)=>{
        return Promise.all(headers.map((item)=>{
            return rest_list_files_metadata(user,item);
        })).then((e: IGFile[])=>resolve(e)).catch((e)=>reject());
    });
}

export function list_file_metadata(user: ILoginInfo, id: string) : Promise<IGFile>{
    return new Promise((resolve,reject)=>{
        const va: any = {id: id};
        
         return rest_list_files_metadata(user,va).then((e)=>{
             if (e){
                 resolve(e);
             }else{
                 reject();
             }
         }).catch((e)=>{
             reject(e);
         });
    });
}

export function list_objects_folder(user: ILoginInfo, id: string) : Promise<IGFile[]> {
    const result:          IGFile[]  = [];
    const result_filtered: IGFile[]  = [];
    return new Promise((resolve,reject)=>{
         return authorize(user)
        .then((success)=>{
            return rest_list_object_folder(user, result, id, undefined);
        })
        .then((e: IOneDrivePageResponse)=>{
           _.each(_.groupBy(result.map((item)=>{return { 
                id: item.id, title: item.title, mimeType: item.mimeType};
             }),'mimeType'),(value,key)=>{
                 result_filtered.push(...value);
             });
             resolve(result_filtered);
        })
        .catch(()=>{
            reject();
        });
    });
}

export function file_upload(user: ILoginInfo, id: string, data: IContentBuffer) : Promise<boolean>{
    return new Promise((resolve,reject)=>{
        data.id = id;
        return rest_file_upload(user,data).then((e)=>{
            if (e){
                resolve(e);
            }else{
                reject();
            }
        });
    });
}

export function file_download(user: ILoginInfo, id: string) : Promise<IContentBuffer>{
    return new Promise((resolve,reject)=>{
        return rest_file_download(user,id).then((e)=>{
            if (e){
                resolve(e);
            }else{
                reject();
            }
        });
    });
}
