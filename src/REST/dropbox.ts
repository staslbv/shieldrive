
import _ = require('underscore');
import request = require('request');




const TOKEN: string = '1aIwKb6WujkAAAAAAAAZr-_vIGzcZ8x2OVKp1aKichvkbDmy4M6Ka8_uWk8GArRd';
const URL1: string = 'https://api.dropboxapi.com/2';
const URL2: string = 'https://content.dropboxapi.com/2';


function getAuthHeader(): string {
    return 'Bearer ' + TOKEN;
}

function SUCCEEDED(error: any, response: any): boolean {
    if (null == response || typeof response == 'undefined') {
        return false;
    }
    var code = response.statusCode;
    if (typeof code == 'number') {
        return ((code >= 200) && (code < 300));
    }
    return false;
}

export function get_metadata(path: string): Promise<any> {
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
        }, (error: any, response: any, body: any) => {
            if (!SUCCEEDED(error, response)) {
                reject();
            } else {
                resolve(body);
            }
        });

    });
}

export function list_folder(path: string): Promise<any> {
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
        }, (error: any, response: any, body: any) => {
            if (!SUCCEEDED(error, response)) {
                reject();
            } else {
                resolve(body);
            }
        });

    });
}

export function download(body: any): Promise<string> {
    return new Promise((resolve, reject) => {
        request(
            {
                url: URL2 + '/files/download',
                method: 'POST',
                headers: {
                    "Authorization": getAuthHeader(),
                    "Dropbox-API-Arg": JSON.stringify({ path: body.path })
                }, json: false,
                encoding: null
            }, (error: any, response: any, z: any) => {
                if (!SUCCEEDED(error, response) || response.headers['content-type'] != 'application/octet-stream') {
                    reject();
                } else {
                    resolve(z.toString('base64'));
                }
            });
    });
}

export function upload(body: any): Promise<any> {
    return new Promise((resolve, reject) => {
        request(
            {
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
            }, (error: any, response: any, z: any) => {
                if (!SUCCEEDED(error, response)) {
                    reject();
                } else {
                    resolve(response.statusCode);
                }
            });
    });
}


export function sync_item(item: any): Promise<any>{
    return new Promise((resolve,reject)=>{
        const tag: string  = item['.tag'];
        if (tag != 'file'){
            resolve();
        }else{
            const name: string = item['path_lower'];
            console.log('stand by : ' + name);
            download({
               path: name
           })
           .then((e)=>{
               console.log('downloaded ... : ' + name);
               resolve(e);
           })
           .catch((e)=>{
               resolve();
           });
        }
    });
}

export function sync_folder(path: string): Promise<any> {
    return new Promise((resolve,reject)=>{
        return list_folder(path)
        .then((items)=>{
            return Promise.all(items.entries.map((item)=>{
                return sync_item(item);
            }).then((data)=>{

            },(error)=>{
                
            }));
        })
        .catch((error)=>{
            reject();
        });
    });
}

export function sync_folder2(path: string): Promise<any> 
{
   return list_folder(path).then((items)=>{
       return Promise.all(items.entries.map((item)=>{
           return sync_item(item);
       }));
   } ).then(()=>{
        console.log('ACCEPTED AND FINISHED');

   }).catch((e)=>{
       console.log('some error had occured ...');
   });
}








