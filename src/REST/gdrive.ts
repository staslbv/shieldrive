const  request = require('request');
const  _ = require('underscore');

import * as FIELD from   '../constant';
import {ILoginInfo} from '../constant';
import {IContentBuffer} from '../constant';
import {IProtectResult} from '../constant';
import {IShieldoxIOProtectArgs} from '../constant';
import {SHIELDOX_BASE_URL} from '../helpacc';

export interface IGCapability{
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canCopy: boolean;
    canReadRevisions: boolean;
};
export interface IGContact{
    kind: string;
    displayName: string;
    me: boolean;
    permissionId: string;
    emailAddress: string;
    isAuthenticatedUser: boolean;
};

export interface IGFile{
    kind:             string;
    id:               string;
    title:            string;
    originalFilename: string;
    fileExtension:    string;
    md5Checksum:      string;
    mimeType:         string;
    createdDate:      string;
    modifiedDate:     string;
    sharingUser:      IGContact;
    owners:           IGContact[];
    parents:          any[];
    fileSize:         number;
    ownedByMe:        boolean;
    shared:           boolean;
    editable:         boolean;
};

export const IGFile_FIELD  =  'id,title,fileExtension,fileSize,owners,parents';

export interface IGPagedFilesResponse{
    kind: string;
    nextPageToken: string;
    items: IGFile[];
    files: IGFile[];
}; 

const GOOGLE_DRIVE_URL : string = 'https://www.googleapis.com';

function SUCCEEDED(error: any, response: any): boolean {
    if (null == response || typeof response == 'undefined') {
        console.log('request error: NO RESPONSE');
        return false;
    }
    var code = response.statusCode;
    if (typeof code == 'number') {
        
        console.log('error code: ' + code);

        return ((code >= 200) && (code < 300));
    }
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

function isValidMIME_Type(mime: string): boolean{
  const values : string[] = [
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
  if (mime && typeof mime == 'string' && mime.length > 0){
      mime = mime.toLowerCase();
      for(var i: number = 0; i < values.length; i ++){
          if (mime.indexOf(values[i]) >= 0){
              return true;
          }
      }
  }
  return false;
}

function rest_list_files_scan(user: ILoginInfo, flagFolder: boolean, buffer: IGFile[],  title: string, token: string) : Promise<IGPagedFilesResponse>{
   return new Promise((resolve,reject)=>{
       var url = '/drive/v2/files?';
       const q_title: string = ((title && typeof title == 'string' && title.length > 0) ? " and title=\'" + title + "\')" : ')');
       const q_FOLDER: string   = "q=(" + encodeURIComponent("mimeType=\'application/vnd.google-apps.folder\'"   +  q_title);
       const q_FILE: string     = "q=(" + encodeURIComponent("(mimeType contains \'office\' or mimeType contains \'msword\' or mimeType contains \'ms-excel\' or mimeType contains \'ms-powerpoint\' or mimeType contains \'application/pdf\' or mimeType contains \'application/x-pdf\' or mimeType contains \'application/vnd.pdf\' or mimeType contains \'application/acrobat\')"  + q_title);
       url +=  (flagFolder ?  q_FOLDER : q_FILE);
       if (token && typeof token == 'string' && token.length > 0){
           url += '&pageToken='+ token;
       } 
       request({
           url: GOOGLE_DRIVE_URL + url,
           method: 'GET',
           headers: {
                Authorization: getAuthHeader(user)
            },
            json: true
       }, (error: any, response: any, body: IGPagedFilesResponse)=>{
           if (SUCCEEDED(error,response) && body && body.items){
              
               buffer.push(...body.items);
               if (body.items.length == 0 || typeof body.nextPageToken != 'string' || body.nextPageToken.length == 0 ){     
                   resolve(body);
               }else{
                   resolve( rest_list_files_scan(user, flagFolder, buffer, title, body.nextPageToken));
               }
           }else{
                reject();
           }
       });
   });
}

function rest_list_object_folder(user: ILoginInfo , buffer: IGFile[],  rid: string, token: string) : Promise<IGPagedFilesResponse>{
   return new Promise((resolve,reject)=>{
       var url = '/drive/v2/files?q=' + encodeURIComponent("\'" +  rid + "\' in parents");
       request({
           url:    GOOGLE_DRIVE_URL + url,
           method: 'GET',
           headers: { Authorization: getAuthHeader(user)}, json: true
       }, (error: any, response: any, body: IGPagedFilesResponse)=>{
           if (SUCCEEDED(error,response) && body && body.items){
               buffer.push(...body.items);
               if (body.items.length == 0 || typeof body.nextPageToken != 'string' || body.nextPageToken.length == 0 ){     
                   resolve(body);
               }else{
                   resolve(rest_list_object_folder(user, buffer, rid, body.nextPageToken));
               }
           }else{
                reject();
           }
       });
   });
}

function rest_list_files_metadata(user: ILoginInfo, item: IGFile): Promise<IGFile>{
    return new Promise((resolve,reject)=>{
        var result: any = undefined;
        var url = '/drive/v2/files/' + item.id;
        console.log('item: ' + url);
        request({
            url: GOOGLE_DRIVE_URL + url, 
            method: 'GET',
            headers: {Authorization: getAuthHeader(user)},
            json:true},
        (error: any, response: any, body: IGFile)=>{
            if (SUCCEEDED(error,response)){
                result = body;
            }
            resolve(result);
        });
    });
}

function rest_file_download(user: ILoginInfo, id: string) : Promise<IContentBuffer>{
    return new Promise((resolve,reject)=>{
         request({
            url: GOOGLE_DRIVE_URL + '/drive/v3/files/' + id + '?alt=media', 
            method: 'GET',
            headers: {Authorization: getAuthHeader(user)},
            json:false,
            encoding: null},
        (error: any, response: any, body: Buffer)=>{
           // response.headers['content-type']
            if (!SUCCEEDED(error, response)){
                resolve(undefined);
            }else{
                resolve({id: id, contentType: response.headers['content-type'], data: body.toString('base64')});
            }
        });
    });
} 

function rest_file_upload(user: ILoginInfo, content: IContentBuffer): Promise<boolean>{
    return new Promise((resolve,reject)=>{
        const url: string = '/upload/drive/v2/files/' + content.id + '?uploadType=media&newRevision=false&updateViewedDate=false';
        console.log(url + ' ' + content.data.length);
        request({
             url: GOOGLE_DRIVE_URL + url, 
             method: 'PUT',
             headers: {"Authorization": getAuthHeader(user), "Content-Type": content.contentType},
             json: false,
             encoding: null,
             body: new Buffer(content.data,'base64')
        },(error: any, response: any, body: IGFile)=>{
            if(SUCCEEDED(error,response)){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
}

export function list_files_scan(user: ILoginInfo, flagFolder: boolean, title: string): Promise<IGFile[]>{
    const result: IGFile[]  = [];
    return new Promise((resolve,reject)=>{
        return authorize(user)
        .then((success)=>{
            return rest_list_files_scan(user, flagFolder, result, title, undefined);
        })
        .then((e: IGPagedFilesResponse)=>{
            resolve(result);
        })
        .catch(()=>{
            reject();
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
        .then((e: IGPagedFilesResponse)=>{
            //resolve(result);
           _.each(_.groupBy(result.map((item)=>{return { 
                id: item.id, title: item.title, mimeType: item.mimeType};
             }),'mimeType'),(value,key)=>{
                 if (isValidMIME_Type(key)){
                      result_filtered.push(...value);
                 }
             });
             resolve(result_filtered);
        })
        .catch(()=>{
            reject();
        });
    });
}

export function list_files_metadata(user: ILoginInfo, headers: IGFile[]) : Promise<IGFile[]>{
    return new Promise((resolve,reject)=>{
        return Promise.all(headers.map((item)=>{
            return rest_list_files_metadata(user,item);
        })).then((e: IGFile[])=>resolve(e));
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
         });
    });
}

export function get_folder_by_path(user: ILoginInfo, path: string): Promise<IGFile>{
    return new Promise((resolve,reject)=>{
        return authorize(user)
        .then(()=>{

        }).catch(()=>reject());
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

export function rest_folder_shieldox_register(user: ILoginInfo, id: string): Promise<string>{
     return new Promise((resolve,reject)=>{
        console.log('folder id: ' + id);
        request({
             url: SHIELDOX_BASE_URL + '/account/CreateFolder', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId": user.account.account.key,
                 "sldx_accType": 2
                },
             json: {
                 parentId: user.account.account.objectId,
                 folderId: id,
                 name: 'cloud'
             }

        },(error: any, response: any, body: any)=>{
            if(SUCCEEDED(error,response)){
                resolve(body.objectId);
            }else{
                reject();
            }
        });
    });
}

export function rest_file_shieldox_protect(user: ILoginInfo, args: IShieldoxIOProtectArgs): Promise<IShieldoxIOProtectArgs>{
    return new Promise((resolve,reject)=>{
        request({
             url: SHIELDOX_BASE_URL + '/meta/lock', 
             method: 'POST',
             headers: {
                 "Authorization": 'Basic ' + user.token.access_token,
                 "sldx_accId": user.account.account.key,
                 "sldx_accType": 2
                },
             json: args

        },(error: any, response: any, body: IShieldoxIOProtectArgs)=>{
            if(SUCCEEDED(error,response)){
                resolve(body);
            }else{
                reject();
            }
        });
    });
}

export function protect(user: ILoginInfo, id: string, color: number) : Promise<IProtectResult>  {
    var file:     IGFile;
    var buffer:   IContentBuffer;
    var vargs:    IShieldoxIOProtectArgs;
    var folderId: string;
    return new Promise((resolve,reject)=>{
        return authorize(user)
        .then(()=>list_file_metadata(user,id))
        .then((e)=>{
            file = e;
            return rest_folder_shieldox_register(user,file.parents[0].id);
        })
        .then((e)=>{
            folderId = e;
            return file_download(user,id);
        })
        .then((e)=>{
            buffer = e;
            vargs = {
                date:     Date.parse(file.modifiedDate),
                path:     file.title,
                color:    color,
                cloudKey: file.id,
                dirty:    false,
                objectId: '',
                protect:  true,
                folderId: folderId,
                data:     buffer.data,
            };
            return rest_file_shieldox_protect(user, vargs);
        })
        .then((e)=>{
           if (!e.dirty){
               resolve({ color: e.color});
           }
           else{
               vargs.objectId     = e.objectId;
               buffer.data        = e.data;
               return file_upload(user,id,buffer);
           }
        })
        .then((e)=>{
            if (!e){
                reject();
            }else{
                resolve({ color: vargs.color});
            }
        })
        .catch(()=>reject());
    });
}
