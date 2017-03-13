"use strict";
const mongo = require("mongodb");
const client = mongo.MongoClient;
var _ = require('underscore');
var request = require('request');
const url1 = "mongodb://probot-long-term-memory:4C6km8d6Na8wOCQ9mYp4BYMpajfHGztjwj7bVADs0xWhEyMCAA8a09hACnIJ3LAsGGZxNiWCjc5nxZQK8RCMNA==@probot-long-term-memory.documents.azure.com:10250/main?3t.connection.name=Probot+Long-Term+Memory&3t.uriVersion=2&3t.certificatePreference=RootCACert:accept_any&3t.connectionMode=direct&3t.useClientCertPassword=false&readPreference=primary&ssl=true";
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '35.185.92.145',
    port: 3306,
    user: 'root',
    password: 'Bonanza12',
    database: 'main'
});
connection.connect();
client.connect(url1).then((mongodb) => {
    dumpUsers(connection).then((e) => {
        const userCollection = e;
        console.log(JSON.stringify(userCollection, null, 4));
        mysql_query(connection, 'SELECT collectionName,identifier,friendlyName,accountType FROM entities').then((rows) => {
            Promise.all(_.map(rows, (e) => {
                const collection = e;
                collection.MAIN = [];
                return mysql_query(connection, 'SELECT identifier,collectionName FROM properties WHERE entityIdentifier = \'' + e.identifier + '\' and category = \'MAIN\'')
                    .then((e) => {
                    collection.MAIN.push(...e);
                })
                    .catch((e) => {
                    console.log('failed to get MAIN');
                });
            })).then(() => {
                console.log('running mongo db ...');
                mongodb.listCollections().toArray().then((e) => {
                    var collectionArray = e;
                    Promise.all(_.map(rows, (e) => {
                        return mongodump(mongodb, e, collectionArray, userCollection);
                    })).then((e) => {
                        console.log('mongo all succeeded');
                        Promise.all(_.map(e, (v) => {
                            return syncPreco(v);
                        })).then(() => {
                            console.log('all objects reported ...');
                        });
                    }).catch(() => {
                        console.log('failed to promise all mongos');
                    });
                });
            }).catch(() => {
                console.log('failed to extract name entities');
            });
        });
    }).catch(() => {
    });
});
function mysql_query(connection, query) {
    return new Promise((resolve, reject) => {
        connection.query(query, (e, rows, fields) => {
            if (e) {
                reject(e);
            }
            else {
                resolve(rows);
            }
        });
    });
}
function dumpUsers(connection) {
    return new Promise((resolve, reject) => {
        return mysql_query(connection, 'SELECT identifier,accounts FROM users').then((e) => {
            resolve(_.map(e, (item) => {
                return {
                    objectId: item.identifier,
                    accounts: JSON.parse(item.accounts)
                };
            }));
        }).catch(() => reject());
    });
}
function mongodump(db, row, collections, userAccounts) {
    return new Promise((resolve, reject) => {
        if (row.MAIN.length == 0) {
            resolve(undefined); // no name entity
        }
        else {
            const fiendName = row.MAIN[0].collectionName;
            return findCollection(row.collectionName, collections)
                .then((e) => {
                return db.collection(e).find({ [fiendName]: { $ne: null } }, { [fiendName]: 1 }).toArray().then((e) => {
                    _.each(e, (value) => {
                        if (value[fiendName] && !_.isString(value[fiendName])) {
                            value[fiendName] = undefined;
                        }
                    });
                    resolve(_.map(e, (item) => {
                        var _id = item._id;
                        var acc = _id.split(';');
                        var _userId = undefined;
                        userAccounts.forEach((e) => {
                            if (typeof _userId == 'undefined') {
                                if ((_userId = _.find(e.accounts, (z) => {
                                    return ((typeof z == 'string') && (z.toLowerCase() == acc[0].toLowerCase()));
                                }))) {
                                    _userId = e.objectId;
                                }
                            }
                        });
                        if (acc.length != 2 || typeof item[fiendName] == 'undefined' || typeof _userId == 'undefined') {
                            return undefined;
                        }
                        else {
                            return {
                                objectId: acc[1],
                                accountId: acc[0],
                                value: item[fiendName],
                                accountType: row.accountType.toLowerCase(),
                                objectType: row.friendlyName.toLowerCase(),
                                userId: _userId
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
function findCollection(name, collectionArray) {
    return new Promise((resolve, reject) => {
        var found = false;
        collectionArray.forEach((e) => {
            if (!found) {
                found = (e.name.toLowerCase() == name.toLowerCase());
            }
        });
        if (found) {
            resolve(name);
        }
        else {
            reject();
        }
    });
}
//http://scpreco.azurewebsites.net/api/import/sync
function syncPreco(input) {
    return new Promise((resolve, reject) => {
        if (typeof input == 'undefined') {
            resolve();
        }
        else {
            return Promise.all(_.map(input, (e) => {
                return syncPreco2(e);
            })).then(() => {
                resolve();
            });
        }
    });
}
function syncPreco2(input) {
    return new Promise((resolve, reject) => {
        console.log(JSON.stringify(input));
        request({
            url: 'https://scpreco.azurewebsites.net/api/import/sync',
            method: 'POST',
            json: input
        }, (error, response, body) => {
            resolve(body);
        });
    });
}
