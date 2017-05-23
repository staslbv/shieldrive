"use strict";
const mongo = require("mongodb");
const client = mongo.MongoClient;
var _ = require('underscore');
var request = require('request');
const url1 = "mongodb://probot-long-term-memory:4C6km8d6Na8wOCQ9mYp4BYMpajfHGztjwj7bVADs0xWhEyMCAA8a09hACnIJ3LAsGGZxNiWCjc5nxZQK8RCMNA==@probot-long-term-memory.documents.azure.com:10250/main?3t.connection.name=Probot+Long-Term+Memory&3t.uriVersion=2&3t.certificatePreference=RootCACert:accept_any&3t.connectionMode=direct&3t.useClientCertPassword=false&readPreference=primary&ssl=true";
const token = 'EwAYA8l6BAAU7p9QDpi/D7xJLwsTgCg3TskyTaQAAcX%2bqJlXoRamRt1u3OLb%2b0YliL3skZtXtqzL%2bi%2bygLMB%2bdzbnElEfhSUhsVDPzXOvSrma%2b2y3%2bcSRQb5Wv7LILJkQ1CToqkPj08rHrWuv5e4/9B3z1uSAz8WfcBLUENVl1/ORzCOW%2b3lElsDu6dcSMxrrpus71K1b5OnFZ0IDwldyiBBytcHKerGc2TdNQ%2bsxRkJBS8iDCJ%2bquUI4IHJBj4j7hJd5vwPIQmYFwASz0sAEIrg%2bOjr6uN5NDhqqimk35MCQFfy3MfzXJ7jJb5atA67utz%2byRPIEQvKY6%2bKi/sdyc0flyPreI1RwLgaPcgxeJlmmxp8E8ZSkyfNjPC%2bEJ8DZgAACG44tEpmd%2bAR6AHZvf8EAx7EmzdfZ7jR83Dx%2bc/nuLNc6E9JBEG7PRYPrVQxXauFYRRGMi7eWHo7/ry2pRiH4IHbk3CEbn37cmlhoftAtAnPGpeM1K7Bj7RAUYiEpLa7WEZmffvnThqVrZ6Z7iYrn8tWaf6IFbYA2sU2EPPFHoo/0%2bSvxLLFTLgh9bF5ccJDf9p/1DnCBmw6d58TMHElvzQFvVn8Q2X4p2DVz/iT7cYFAdS5ifMXLgz29zQw%2bxFDpnNecbMivRbyoIRLSfd3mx0RWeI3Ns1rlwRp6OLhpdvx7TY9x9tI5qyvig1OY4j0qdwzlHb20awh3OqL9N2fPJll0ZPY2u2AqTY9APv8ScNkB1okYtaC3qHB4J8XsvolA1FYVqLjNaytwE1mtylhgmezmX4fgVsQK2iOuLVgjA9Yl5/RIH3iie4uMmfs7dgDAWUsTF1bCb6EvKc5/F/gy6qWeOUi5nzVq6yj/5ujC3wyAnQeiTTR155wBDIIZnDSVPQ60TaKSy3%2bUx2Cs1Zh7pjbobhRaipjgpiEc4cttUpTHKTWKURxHyTvlQTaWNyxRlgExy1v3BkQYywTU%2b8qkSXyLcFt75vLv1ro9UOwqQiGg8Xz7yno0QiHxCvu6LI0JfG3OfqEhgkCfbKnUZvgAlxsyxYC';
const user_id = 'AAAAAAAAAAAAAAAAAAAAACdFQVo7MMzgoPhU4CcrX3g';
const def_drive_id = '2343468607d76c9b';
const def_user_id = '2343468607d76c9b';
var TEST_VALUE;
(function (TEST_VALUE) {
    TEST_VALUE[TEST_VALUE["FIRST"] = 0] = "FIRST";
    TEST_VALUE[TEST_VALUE["SECOND"] = 1] = "SECOND";
})(TEST_VALUE || (TEST_VALUE = {}));
const value = TEST_VALUE.SECOND;
console.log(typeof value + ' : ' + value);
//downloadFile();
//getItemPermissions();
getFolderChildrenById();
//getUserProfile();
//getUserDrives();
// works
function getUserProfile() {
    console.log('48828568e1b65d1f');
    request({
        // "id": "2343468607d76c9b",
        // "mail": null
        url: 'https://graph.microsoft.com/v1.0/users/' + 'lizy.pitman@gmail.com',
        method: 'GET',
        headers: {
            "Authorization": 'Bearer ' + token
        },
        json: true
    }, (error, response, body) => {
        console.log(JSON.stringify(body, undefined, 4));
    });
}
// works
function getUserDrives() {
    request({
        // "id": "2343468607d76c9b",
        // "mail": null
        url: 'https://graph.microsoft.com/v1.0/drives/' + '48828568e1b65d1f',
        method: 'GET',
        headers: {
            "Authorization": 'Bearer ' + token
        },
        json: true
    }, (error, response, body) => {
        console.log(JSON.stringify(body, undefined, 4));
    });
}
// works
function getFolderChildrenById() {
    request({
        // "id": "2343468607d76c9b",
        // "mail": null
        url: 'https://graph.microsoft.com/v1.0/drive/items/48828568E1B65D1F%21189',
        //url: 'https://graph.microsoft.com/v1.0/drive/items/root/children', 
        method: 'GET',
        headers: {
            "Authorization": 'Bearer ' + token
        },
        json: true
    }, (error, response, body) => {
        console.log(JSON.stringify(body, undefined, 4));
    });
}
// works
function getItemPermissions() {
    request({
        // "id": "2343468607d76c9b",
        // "mail": null
        url: 'https://graph.microsoft.com/v1.0/drive/items/48828568E1B65D1F%21189/permissions',
        method: 'GET',
        headers: {
            "Authorization": 'Bearer ' + token
        },
        json: true
    }, (error, response, body) => {
        console.log(JSON.stringify(body, undefined, 4));
    });
}
function uploadFile(va) {
    request({
        url: 'https://graph.microsoft.com/v1.0/drive/items/2343468607D76C9B!107/content',
        method: 'PUT',
        headers: { "Authorization": 'Bearer ' + token },
        json: false,
        timeout: 300000,
        encoding: null,
        body: va
    }, (error, response, body) => {
        console.log(body);
        console.log(response.toJSON());
    });
}
function downloadFile() {
    request({
        url: 'https://graph.microsoft.com/v1.0/drive/items/2343468607D76C9B%21102/content',
        method: 'GET',
        headers: { "Authorization": 'Bearer ' + token },
        json: false,
        timeout: 300000,
        encoding: null
    }, (error, response, body) => {
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
