import Sequelize = require('sequelize');

import * as MODEL from   '../../constant';

import {IUrlHost} from '../../constant';
import {IUrlPath} from '../../constant';

const _  = require('underscore');


module.exports = function(source: Sequelize ,type: Sequelize.DataTypes): any {
    var db = source.define('preco_path',{
        [MODEL.PID_URL_PATH]:{
            type: type.STRING,
            allowNull: false
        }
    },{
        classMethods:
        {
            getObject: function(host: IUrlHost, value: string): Promise<IUrlPath>{
                return new Promise((resolve,reject)=>{
                    if (!host || typeof host.id != 'number' || host.id <= 0 ){
                        reject();
                    }else if (!value || typeof value != 'string' ){
                        reject();
                    }else{
                        const norm_value: string = value.toLowerCase().trim();
                        if (norm_value.length == 0){
                            reject();
                        }else{
                            return db.findOne({
                                where:{[MODEL.PID_URL_HOST_PKEY]: host.id,[MODEL.PID_URL_PATH]: norm_value}
                            }).then((e)=>{
                                if (!e){
                                    reject();
                                }else{
                                    resolve(e);
                                }
                            },()=>{reject();});    
                        }
                    }

                });
            },
            createObject: function (host: IUrlHost, value: string): Promise<IUrlPath>{
                return new Promise((resolve,reject)=>{
                     if (!host || typeof host.id != 'number' || host.id <= 0 ){
                        reject();
                    }else if (!value || typeof value != 'string' ){
                        reject();
                    }else{
                        const norm_value: string = value.toLowerCase().trim();
                        if (norm_value.length == 0){
                            reject();
                        }else{
                            return db.create({[MODEL.PID_URL_HOST_PKEY]: host.id,[MODEL.PID_URL_PATH]: norm_value}).then((e)=>{
                                if (!e){
                                    reject();
                                }else{
                                    resolve(e);
                                }
                            },()=>{reject();});    
                        }
                    }
                });
            }
        }
    });
    return db;
}