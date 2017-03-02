import Sequelize = require('sequelize');

import  *  as MODEL from   '../../constant';

const _          = require('underscore');

const cryptojs   = require('crypto-js');

import {IFolderWorkerStatus} from '../../constant';
import {ILoginInfo} from '../../constant';

module.exports = function(source: Sequelize ,type: Sequelize.DataTypes): any {
    var db = source.define('workfolder',{
        [MODEL.PID_KEY]:{
            type: type.STRING,
            allowNull: false,
            unique:  true
        },
        [MODEL.PID_JOB_FLAG_BACKGND]:       {type: type.BOOLEAN},
        [MODEL.PID_JOB_FLAG_CANCELPENDING]: {type: type.BOOLEAN},
        [MODEL.PID_JOB_FLAG_PROTECT]:       {type: type.BOOLEAN},
        [MODEL.PID_JOB_FLAG_RUNNING]:       {type: type.BOOLEAN},
        [MODEL.PID_JOB_PROCESS_ID]:         {type: type.INTEGER}
    },{
        classMethods:
        {
            getObject: function(key: string): Promise<IFolderWorkerStatus>{
                return new Promise((resolve,reject)=>{
                    if (typeof key != 'string' || key.length == 0){
                        reject(412);
                    }else{
                        return db.findOne({where:{[MODEL.PID_KEY]: key}})
                        .then((e)=>{
                            if (e){
                                resolve(e);
                            }else{
                                reject(404);
                            }
                        })
                        .catch(()=>reject(500));
                    }
                });
            },
            createObject: function (key: string, user: ILoginInfo,backgnd: boolean, color: number ): Promise<IFolderWorkerStatus>{
                return new Promise((resolve,reject)=>{
                     if (typeof key != 'string' || key.length == 0 || !user){
                          reject(412);
                     }else{
                         return db.create({
                             [MODEL.PID_ACCOUNT_PKEY]: user.account.account.id,
                             [MODEL.PID_KEY]: key,
                             [MODEL.PID_JOB_FLAG_BACKGND]: backgnd,
                             [MODEL.PID_JOB_FLAG_CANCELPENDING]: false,
                             [MODEL.PID_JOB_FLAG_PROTECT]: (color > 0 ? true : false),
                             [MODEL.PID_JOB_FLAG_RUNNING]: false,
                             [MODEL.PID_JOB_PROCESS_ID]: process.pid
                         })
                         .then((e)=>{
                             if (!e){
                                 reject(500);
                             }else{
                                 resolve(e);
                             }
                         })
                         .catch(()=>reject(500));
                     } 

                });
            },
            resetObject: function(id: number, fprotect: boolean, fbackGnd: boolean,cancel: boolean):Promise<boolean>{
                return new Promise((resolve,reject)=>{
                    return db.update({
                        [MODEL.PID_JOB_FLAG_CANCELPENDING]: cancel,
                        [MODEL.PID_JOB_FLAG_PROTECT]: fprotect,
                        [MODEL.PID_JOB_FLAG_BACKGND]: fbackGnd
                    },{
                        where:{[MODEL.PID_ID]: id}
                    }).then((e)=>{
                        resolve(true);
                    }).catch(()=>reject(500));
                });
            },

            stopRunning: function(id: number):Promise<boolean>{
                return new Promise((resolve,reject)=>{
                    return db.update({
                        [MODEL.PID_JOB_FLAG_RUNNING]:       false,
                        [MODEL.PID_JOB_PROCESS_ID]:         process.pid
                    },{
                        where:{[MODEL.PID_ID]: id}
                    }).then((e)=>{
                        resolve(true);
                    }).catch(()=>reject(500));
                });
            },
            start: function(id: number): Promise<boolean>{
                return new Promise((resolve,reject)=>{
                    return db.update({
                        [MODEL.PID_JOB_FLAG_RUNNING]:        true,
                        [MODEL.PID_JOB_FLAG_CANCELPENDING]:  false
                    },{
                        where:{[MODEL.PID_ID]: id}
                    }).then((e)=>{
                        resolve(true);
                    }).catch(()=>reject(500));
                });
            },
            stop: function(id: number): Promise<boolean>{
                return new Promise((resolve,reject)=>{
                    return db.update({
                        [MODEL.PID_JOB_FLAG_RUNNING]:       false,
                        [MODEL.PID_JOB_FLAG_BACKGND]:       false,
                        [MODEL.PID_JOB_FLAG_CANCELPENDING]: false,
                    },{
                        where:{[MODEL.PID_ID]: id}
                    }).then((e)=>{
                        resolve(true);
                    }).catch(()=>reject(500));
                });
            }


        }
    });
    return db;
}