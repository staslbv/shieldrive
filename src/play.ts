import * as mongo from 'mongodb';

const client: any = mongo.MongoClient;

var _       = require('underscore');

var request = require('request');

const url1: string         = "mongodb://probot-long-term-memory:4C6km8d6Na8wOCQ9mYp4BYMpajfHGztjwj7bVADs0xWhEyMCAA8a09hACnIJ3LAsGGZxNiWCjc5nxZQK8RCMNA==@probot-long-term-memory.documents.azure.com:10250/main?3t.connection.name=Probot+Long-Term+Memory&3t.uriVersion=2&3t.certificatePreference=RootCACert:accept_any&3t.connectionMode=direct&3t.useClientCertPassword=false&readPreference=primary&ssl=true";

const token:string         = 'EwAYA8l6BAAU7p9QDpi/D7xJLwsTgCg3TskyTaQAATaPvmTwjiXd5nWytHHzCxGF4OJi4JXplbOxFFdPxQ/HgOUvx1BVmd1TlC6QQz0NF/bZy1SdPlfIJWFkFF0%2b9OR95dGhDgIIkto2GRoavthXlb6uEOWB7Mr401NkthTh6DLckleKVAt5pCnqmj7f1dgohVGy6/JERtKWEey/2u2rqhUblaLyh0EZaXumbM/S4zVrkJ7gsT6XK3JLN5WUhj8QYAQOYSGZStmLZpooNq8efBTWtbtfSoD7T83t3nwHI0SyP3L8rPA57SNgR9Ef/gP6p117LYShfwsZSnikEQ6RjCS/umcrI7J0eHXw0KvLWofeOLFF4iMG0YRFvJxRol8DZgAACAIkl%2bR67rzm6AHj1cJwLIeFdug%2b9BJzQ%2bD8b4HuvOh1LGSU59Yq31EGqN3gCEpIAlGA4OKXT1nwG12jSx5yk0uGdKPIRpM3xb%2bkVq7Ljw0kZP3OVL1PEqctdYOXp9/kbIxdfCtCz7gM9L/XX32LP3b3qHlhNOoX8AmsgzUSBvF7JJDCaN5G1vY/Y6n97xa/G%2bop%2bv02yNs8BMh6RSOaUA8doge40XnOsqvtqfsyySmb9M1WGqBrdGZaIrrvEsGjt3P8A5yUZ5i6xngH519BYjUIqdr56ob0PYbmLVxqiXbKngYk98QTL30FQ2WJN5yjG9Sh63o%2boP2bLQ8ySJUZgM%2b1tVF7dnGqvL2/1akx%2b0d1UT3g25iUY2Q%2b2gEM65pvWC1bPxyebDDfhQs/sn9TcaMCo2TEmdTrD/33MWy12G%2b4BebcC%2bhLsyhm0IVp6mp8UKeiTHwEh6do2GByQF3EpEbW2YhE3oluNfqz1nCuUZvbty%2bfIAvpgTKowOB0NDCkgFZ2jvscKjiycQucbF7tD%2bYCl3vDwTJc6Fa7l1ZVmDCK2dlKM29VN%2bwZCoCDh/xeZLRKd8WgE0%2ba7KnpDpHex4NGozdf5DTLMTiap6faNGYH6/SsISlPrODf6wc%2bZIDe9TQvy6eBgyfKDsKp5WFHDTUdGBYC';

const user_id:string       = 'AAAAAAAAAAAAAAAAAAAAACdFQVo7MMzgoPhU4CcrX3g';

const def_drive_id:string  = '2343468607d76c9b'

const def_user_id : string = '2343468607d76c9b'

enum TEST_VALUE
{
    FIRST,
    SECOND
}

const value : TEST_VALUE = TEST_VALUE.SECOND;

console.log(typeof value +  ' : ' + value );


//downloadFile();
//getItemPermissions();
//getFolderChildrenById();
getUserProfile();
//getUserDrives();
// works
function getUserProfile(): void{
   

     request({ // userPrincipalName 
               // "id": "2343468607d76c9b",
               // "mail": null
             url: 'https://graph.microsoft.com/v1.0/users/' + user_id, 
             method: 'GET',
             headers: {
                 "Authorization": 'Bearer ' + token
                },
             json: true
        },(error: any, response: any, body: any)=>{
            console.log(JSON.stringify(body,undefined,4));
        });
    
}
// works
function getUserDrives(): void{
     request({ // userPrincipalName 
               // "id": "2343468607d76c9b",
               // "mail": null
             url: 'https://graph.microsoft.com/v1.0/drives/' + '2343468607d76c9b', 
             method: 'GET',
             headers: {
                 "Authorization": 'Bearer ' + token
                },
             json: true
        },(error: any, response: any, body: any)=>{
            console.log(JSON.stringify(body,undefined,4));
        });
    
}

// works
function getFolderChildrenById(): void{
     request({ // userPrincipalName 
               // "id": "2343468607d76c9b",
               // "mail": null
             url: 'https://graph.microsoft.com/v1.0/drive/items/root/children', 
             method: 'GET',
             headers: {
                 "Authorization": 'Bearer ' + token
                },
             json: true
        },(error: any, response: any, body: any)=>{
            console.log(JSON.stringify(body,undefined,4));
        });
    
}

// works
function getItemPermissions(): void{
     request({ // userPrincipalName 
               // "id": "2343468607d76c9b",
               // "mail": null
             url: 'https://graph.microsoft.com/v1.0/drive/items/2343468607D76C9B%21106/permissions', 
             method: 'GET',
             headers: {
                 "Authorization": 'Bearer ' + token
                },
             json: true
        },(error: any, response: any, body: any)=>{
            console.log(JSON.stringify(body,undefined,4));
        });
    
}

function uploadFile (va: Buffer):void {
    request({
            url: 'https://graph.microsoft.com/v1.0/drive/items/2343468607D76C9B!107/content', 
            method: 'PUT',
            headers: {"Authorization": 'Bearer ' + token},
            json:false,
            timeout:  300000,
            encoding: null,
            body: va
          },
        (error: any, response: any, body: Buffer)=>
        {
             console.log(body);
              console.log(response.toJSON());

        });
}

function downloadFile ():void {
    request({
            url: 'https://graph.microsoft.com/v1.0/drive/items/2343468607D76C9B%21102/content', 
            method: 'GET',
            headers: {"Authorization": 'Bearer ' + token},
            json:false,
            timeout:  300000,
            encoding: null},
        (error: any, response: any, body: Buffer)=>
        {
            uploadFile(body);

        });
}


// drive ID 
// /drive or /drives/{id}/items/{item-id} or /drive/root:/path/to/item





/*
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '35.185.92.145',
  port     : 3306,
  user     : 'root',
  password : 'Bonanza12',
  database : 'main'
});

connection.connect();

client.connect(url1).then((mongodb) => {
    dumpUsers(connection).then((e) => {
        const userCollection: any[] = e;
        console.log(JSON.stringify(userCollection,null,4));
        mysql_query(connection, 'SELECT collectionName,identifier,friendlyName,accountType FROM entities').then((rows) => {
            Promise.all(_.map(rows, (e) => {
                const collection: any = e;
                collection.MAIN = [];
                return mysql_query(connection, 'SELECT identifier,collectionName FROM properties WHERE entityIdentifier = \'' + e.identifier + '\' and category = \'MAIN\'')
                    .then((e) => {
                        collection.MAIN.push(...e);
                    })
                    .catch((e) => {
                        console.log('failed to get MAIN')
                    });
            })).then(() => {
                console.log('running mongo db ...');
                mongodb.listCollections().toArray().then((e) => {
                    var collectionArray: any = e;
                    Promise.all(_.map(rows, (e) => {
                        return mongodump(mongodb, e, collectionArray,userCollection);
                    })).then((e) => {
                        console.log('mongo all succeeded');
                        Promise.all(_.map(e,(v)=>{
                            return syncPreco(v);
                        })).then(()=>{
                            console.log('all objects reported ...');
                        });
                    }).catch(() => {
                        console.log('failed to promise all mongos');
                    });
                })
            }).catch(() => {
                console.log('failed to extract name entities');
            });
        });

    }).catch(() => {

    });
});

function mysql_query(connection: any, query: string): Promise<any>{
    return new Promise((resolve,reject)=>{
        connection.query(query,(e,rows,fields)=>{
            if (e){
                reject(e);
            }else{
                resolve(rows);
            }
        });
    });
}

function dumpUsers(connection: any) : Promise<any>{
    return new Promise((resolve,reject)=>{
        return mysql_query(connection,'SELECT identifier,accounts FROM users').then((e)=>{
           resolve( _.map(e, (item)=>{
                return {
                    objectId: item.identifier,
                    accounts: JSON.parse(item.accounts)
                };
            }));
        }).catch(()=>reject())
    });
}



function mongodump(db: any, row: any, collections: any[], userAccounts: any[]) : Promise<any>{
    return new Promise((resolve, reject) => {
        if (row.MAIN.length == 0) {   resolve(undefined); // no name entity
        } else {
            const fiendName: string = row.MAIN[0].collectionName;
            return findCollection(row.collectionName, collections)
                .then((e) => {
                    return db.collection(e).find({[fiendName]:{$ne:null}}, { [fiendName]: 1 }).toArray().then((e) => {
                        _.each(e, (value) => {
                            if (value[fiendName] && !_.isString(value[fiendName])) {
                                value[fiendName] = undefined;
                            }
                        });
                        resolve(_.map(e, (item) => {
                            var _id: string     = item._id;
                            var acc: string[]   = _id.split(';');
                            var _userId: any    = undefined;
                            userAccounts.forEach((e) => {
                                if (typeof _userId == 'undefined') {
                                   if(( _userId = _.find(e.accounts, (z: string) => {
                                         return ((typeof z == 'string') && (z.toLowerCase() == acc[0].toLowerCase()))
                                    }))){
                                        _userId = e.objectId;
                                    }
                                }
                            });
                            if (acc.length != 2 || typeof item[fiendName] == 'undefined' || typeof _userId == 'undefined') {
                                return undefined;
                            } else {
                                return {
                                    objectId:    acc[1],
                                    accountId:   acc[0],
                                    value:       item[fiendName],
                                    accountType: row.accountType.toLowerCase(),
                                    objectType:  row.friendlyName.toLowerCase(),
                                    userId:     _userId
                                };
                            }
                        }));
                    });
                })
                .catch(() => {
                    resolve(undefined);
                });
        }
    });
}

function findCollection(name: string, collectionArray: any): Promise<string>{
    return new Promise((resolve,reject)=>{
        var found: boolean = false;
        collectionArray.forEach((e)=>{
            if (!found){
                found = (e.name.toLowerCase() == name.toLowerCase()); 
            }
        });
        if (found){
            resolve(name);
        }else{
            reject();
        }
    });
}
//http://scpreco.azurewebsites.net/api/import/sync

function syncPreco(input: any): Promise<any>{
    return new Promise((resolve,reject)=>{
        if (typeof input == 'undefined'){
            resolve();
        }else{
           return Promise.all( _.map(input,(e)=>{
               return syncPreco2(e);
           })).then(()=>{
               resolve();
           });
        }
    });
}
function syncPreco2(input: any) : Promise<any>{
    return new Promise((resolve,reject)=>{
         console.log(JSON.stringify(input));
            request({
                url: 'https://scpreco.azurewebsites.net/api/import/sync',
                method: 'POST',
                json: input
            }, (error: any, response: any, body: any) => {
                 resolve(body);
            });
    });
}


*/


