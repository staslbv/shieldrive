
import Sequelize = require('sequelize');

import  *  as MODEL from   '../../constant';

const _          = require('underscore');

const cryptojs   = require('crypto-js');

module.exports = function(source: Sequelize ,type: Sequelize.DataTypes): any {
    var db = source.define('user',{
        [MODEL.PID_EMAIL]:{
            type: type.STRING,
            allowNull: false,
            validate:  {
                isEmail:true
            },
            unique:true
        }
    },{
        classMethods:
        {
            getObject: function(user: MODEL.IUser): Promise<MODEL.IUser>{
                return new Promise((resolve,reject)=>{
                   if (!user || typeof user.email != 'string'){
                       reject();
                   }else{
                       const norm_email = user.email.toLowerCase().trim();
                       if (norm_email.length == 0){
                            reject();
                       }else{
                           return db.findOne({
                               where:{
                                   [MODEL.PID_EMAIL]: norm_email
                               }
                           }).then((e)=>{
                               if (!e){ 
                                  reject();
                               }else{
                                  resolve(e);
                               }
                           }).catch((e)=>{
                               reject();
                           });
                       }
                   }
                });
            },
            createObject: function (user: MODEL.IUser): Promise<MODEL.IUser>{
                return new Promise((resolve,reject)=>{
                    if (!user || typeof user.email != 'string'){
                        reject();
                    }else{
                        return db.create({
                            [MODEL.PID_EMAIL]:user.email.toLowerCase().trim()
                        }).then((e)=>{
                           if (!e){
                               reject();
                           }else{
                               resolve(e);
                           }
                        }).catch((e)=>{
                            reject();
                        });
                    }
                });
            }
        }
    });
    return db;
}