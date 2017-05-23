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

export interface INameId
{
    parentId: string,
    childId: string,
    folder: boolean
}

export interface IGContact{
    name: string;
    emailAddress: string;
    role: string;
};

export interface IUsersPermissions{
   items: IGContact[];
};

export interface IGUserPermission{
    id: string;    // me
    role: string; // writer, owner
}

export interface IGFile{
    id:               string;
    title:            string;
    fileExtension:    string;
    md5Checksum:      string;
    mimeType:         string;
    createdDate:      string;
    modifiedDate:     string;
    userPermission:   IGUserPermission;
    parents:          any[];
    fileSize:         number;
    shared:           boolean;
};

export const IGFile_FIELD  =  'id,title,fileExtension,fileSize,owners,parents';

export interface IGPagedFilesResponse{
    kind: string;
    nextPageToken: string;
    items: IGFile[];
    files: IGFile[];
}; 

const GOOGLE_DRIVE_URL : string = 'https://www.googleapis.com';

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

           if (SUCCEEDED('rest_list_files_scan',error,response, body) && body && body.items){
              
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

function rest_list_files_scan_rid(user: ILoginInfo, flagFolder: boolean, buffer: IGFile[],  title: string, rid: string, token: string) : Promise<IGPagedFilesResponse>{
   return new Promise((resolve,reject)=>{
       var url = '/drive/v2/files?';
       const q_title: string = " and (title=\'" + title + "\')";
       const q_FOLDER: string   = "q=" + encodeURIComponent("\'" +  rid + "\' in parents and " + "(mimeType=\'application/vnd.google-apps.folder\')"   +  q_title);
       const q_FILE: string     = "q=" + encodeURIComponent("\'" +  rid + "\' in parents and " + "(mimeType contains \'office\' or mimeType contains \'msword\' or mimeType contains \'ms-excel\' or mimeType contains \'ms-powerpoint\' or mimeType contains \'application/pdf\' or mimeType contains \'application/x-pdf\' or mimeType contains \'application/vnd.pdf\' or mimeType contains \'application/acrobat\')"  + q_title);
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

           if (SUCCEEDED('rest_list_files_scan_rid',error,response, body) && body && body.items){
              
               buffer.push(...body.items);
               if (body.items.length == 0 || typeof body.nextPageToken != 'string' || body.nextPageToken.length == 0 ){     
                   resolve(body);
               }else{
                   resolve( rest_list_files_scan_rid(user, flagFolder, buffer, title, rid, body.nextPageToken));
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
       if (token && typeof token == 'string' && token.length > 0){
           url += '&pageToken='+ token;
       } 
       request({
           url:    GOOGLE_DRIVE_URL + url,
           method: 'GET',
           headers: { Authorization: getAuthHeader(user)}, json: true
       }, (error: any, response: any, body: IGPagedFilesResponse)=>{
           
           if (SUCCEEDED('rest_list_object_folder',error,response, body) && body && body.items){
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

function rest_list_files_metadata(user: ILoginInfo, item: any, pretry? : ICountArg): Promise<IGFile>{
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
            var statusCode = SUCCESS('rest_list_files_metadata', error,response,body);
            if (statusCode >= 200 && statusCode < 300){
                if (pretry){ 
                    pretry.completed = true; 
                    pretry.body      = body 
                }
                resolve(body);
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
                    }).then(()=> resolve(rest_list_files_metadata(user,item,pretry)));
                }
            }else{
               reject(statusCode);
            }
        });
    });
}

export function rest_file_FindById(user: ILoginInfo, nameId: INameId) : Promise<IGFile>{
    return new Promise((resolve,reject)=>{
        return rest_list_files_metadata(user,{id: nameId.parentId })
        .then((e)=>{
            const buffer: IGFile[] = [];
            return rest_list_files_scan_rid(user,nameId.folder,buffer,nameId.childId,e.id,undefined).then((e)=>{
                if (buffer.length > 0){
                    resolve(buffer[0]);
                }else{
                    console.log('no results');
                    reject(404);
                }
            }).catch((e)=>reject(e));
        })
        .catch((e)=>reject(e));
    });
  
}

function rest_file_download(user: ILoginInfo, id: string, pretry? : ICountArg) : Promise<IContentBuffer>{
    return new Promise((resolve,reject)=>{
         request({
            url: GOOGLE_DRIVE_URL + '/drive/v3/files/' + id + '?alt=media', 
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
                    }).then(()=> resolve(rest_file_download(user,id,pretry)));
                }
            }else{
              reject();
            }
        });
    });
} 

function rest_file_upload(user: ILoginInfo, content: IContentBuffer, pretry? : ICountArg): Promise<boolean>{
    return new Promise((resolve,reject)=>{
        const url: string = '/upload/drive/v2/files/' + content.id + '?uploadType=media&newRevision=false&updateViewedDate=false';
        console.log(url + ' ' + content.data.length);
        const bufferStream : stream.PassThrough = new stream.PassThrough();
        bufferStream.end(new Buffer(content.data,'base64'));
        bufferStream.pipe(
        request({
             url:      GOOGLE_DRIVE_URL + url, 
             method:  'PUT',
             headers:  {"Authorization": getAuthHeader(user), "Content-Type": content.contentType},
             json:     false,
             encoding: null,
             timeout:  300000,
             time: true
             //body:     new Buffer(content.data,'base64')
        },(error: any, response: any, body: IGFile)=>{
            var statusCode = SUCCESS('rest_file_upload', error,response,body);
            if (statusCode >= 200 && statusCode < 300){
                if (pretry){ 
                    pretry.completed = true; 
                    pretry.body      = true; 
                }
                console.log('ULOAD ELLAPSED: [' + response.elapsedTime + ' ] ms.');
                resolve(true);
            }else if (statusCode == 500 || statusCode == 403){
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

export function rest_file_contacts(user: ILoginInfo, id: string, pretry? : ICountArg): Promise<IGContact[]>{
    return new Promise((resolve,reject)=>{
        const url: string = '/drive/v2/files/' + id + '/permissions'
        request({
             url: GOOGLE_DRIVE_URL + url, 
             method: 'GET',
             headers: {"Authorization": getAuthHeader(user)},
             json: true
        },(error: any, response: any, body: IUsersPermissions)=>{
            const buffer: IGContact[] = [];
            var statusCode = SUCCESS('rest_file_contacts', error,response,body);
             if (statusCode >= 200 && statusCode < 300){
                 body.items.forEach((item)=>{
                   if (_.isString(item.emailAddress)){
                       item.emailAddress = item.emailAddress.toLowerCase().trim();
                       if (item.emailAddress.length > 0){
                           buffer.push({
                             emailAddress: item.emailAddress,
                             name:         item.name,
                             role:         item.role
                           });
                       }
                   }
                });
                if (pretry){ 
                    pretry.completed = true; 
                    pretry.body      = buffer ; 
                }
                resolve(buffer);
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


export function rest_file_preview(user: ILoginInfo, nameId: INameId) : Promise<any>{
    var objFile:   IGFile         = undefined;
    return new Promise((resolve,reject)=>{
        return rest_file_FindById(user, nameId).then((e)=>{
           objFile = e;
           return file_download(user,objFile.id).then((e)=>{
              var dargs : IDecryptArgs = {
                  data: e.data,
                  fileName: objFile.title
              };
              var input: any = {
                  data: {
                     fileName: objFile.title
                  }
              };
              return APISHIELD.decrypt(user, dargs).then((e)=>{
                   input.data.data = e.data;
                   return APISHIELD.obj2pdf(user,input).then((e)=>{
                       let result: any = e;
                       result.color    = 1;
                       return APISHIELD.calcColor(user, objFile.id).then((c)=>{
                              result.color = c;
                              resolve(result);
                          }).catch(()=>{
                              resolve(result);
                          });
                   }).catch((e)=>{ // convert failed
                        reject(e);
                   });
              }).catch((e)=>{ // decrypt failed
                  reject(e);
              })
           }).catch((e)=>{ // failed to download file
               reject(e);
           })
        }).catch((e)=>{ // failed to find file;
           reject(e);
        });
    });
}



