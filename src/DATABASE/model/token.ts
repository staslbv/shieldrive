import Sequelize = require('sequelize');

import  *  as MODEL from   '../../constant';

import  {IUserAccount} from   '../../constant';

import _          = require('underscore');

const cryptojs   = require('crypto-js');

module.exports = function(source: Sequelize ,type: Sequelize.DataTypes): any {
    var db = source.define('token',{
        [MODEL.PID_TOKEN_TYPE]:{
            type: type.STRING
        },
        [MODEL.PID_TOKEN_HASH]:{
            type: type.STRING,
            allowNull: false
        },
        [MODEL.PID_ACCESS_TOKEN]:{
            type: type.TEXT,
            allowNull: false
        },
        [MODEL.PID_CLIENT_ID]:{
            type: type.STRING
        },
        [MODEL.PID_UID]:{
            type: type.STRING
        }      
    },{
        classMethods:
        { 
            getObject: function(acc: IUserAccount): Promise<IUserAccount>{
                return new Promise((resolve,reject)=>{
                    if (acc.user.id == 0 || acc.account.id == 0 ){
                        console.log('INVALID TOKEN QUERY DATA');
                        reject();
                    }else
                    {
                       return db.findOne({
                           where:{
                               [MODEL.PID_USER_PKEY]:    acc.user.id,
                               [MODEL.PID_ACCOUNT_PKEY]: acc.account.id
                           }
                       }).then((e)=>{
                           if (e){
                               acc.token = e;
                               resolve(acc);
                           }
                           else{
                               reject();
                           }
                       }).catch((e)=>{
                           reject();
                       });
                    }
                });
            },
            createObject: function (acc: IUserAccount): Promise<IUserAccount>{
                return new Promise((resolve,reject)=>{
                     if ( typeof acc.token.access_token != 'string' || acc.user.id == 0 || acc.account.id == 0){
                         reject();
                     }else{
                         acc.token.token_hash = cryptojs.MD5(acc.token.access_token).toString();
                         acc.token.token_type = (acc.account.type == MODEL.ACCOUNT_TYPE.SYSTEM ? 'Basic' : 'Bearer');
                         acc.token.userId     = acc.user.id;
                         acc.token.accountId  = acc.account.id;
                         return db.create(acc.token).then((e)=>{
                            if (!e){
                                 reject();
                            }else{
                                 console.log('Resolved ...');
                                acc.token = e;
                                resolve(acc);
                            }
                         },()=>{
                             reject();
                         });
                     }
                });
            },
            updateObject: function (acc: IUserAccount): Promise<IUserAccount>{
                return new Promise((resolve,reject)=>{
                    acc.token.token_hash = cryptojs.MD5(acc.token.access_token).toString();
                    console.log('updating to: ' + acc.token.access_token);
                    var obj = {
                       [MODEL.PID_TOKEN_HASH]: acc.token.token_hash,
                       [MODEL.PID_ACCESS_TOKEN]: acc.token.access_token
                    };
                    return db.update(obj,{
                        where:{
                            [MODEL.PID_ID]: acc.token.id
                        }
                    }).then((e)=>{
                        resolve(acc);
                    }).catch((e)=>{
                        reject();
                    });
                });
            }
        }
    });
    return db;
}