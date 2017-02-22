"use strict";
var cryptojs = require('crypto-js');
var _ = require('underscore');
function authorize(db, token) {
    return new Promise(function (resolve, reject) {
        console.log('calculating authorization ...');
        var _accountInstance;
        if (typeof token != 'string')
            return reject();
        var arr = token.split('Bearer');
        if (arr.length <= 1)
            return reject();
        var message = arr[1].trim();
        return db.user.findOne({
            where: {
                password_hash: message
            }
        }).then((e) => {
            if (e) {
                resolve(e);
            }
            else {
                reject(e);
            }
        });
    });
}
exports.authorize = authorize;
