import Sequelize = require('sequelize');

import  *  as MODEL from   '../../constant';

const _          = require('underscore');

const cryptojs   = require('crypto-js');

module.exports = function(source: Sequelize ,type: Sequelize.DataTypes): any {
    var db = source.define('workfolder',{
        [MODEL.PID_KEY]:{
            type: type.STRING,
            allowNull: false,
            unique: true
        }//,
       // [MODEL.PID_STATUS]:{
       //     type: type.INTEGER,
       //     allowNull: false
       // }
    },{
        classMethods:
        {
            getObject: function(user: MODEL.IAccount): Promise<MODEL.IFolderWorkerStatus>{
                return new Promise((resolve,reject)=>{
                });
            },
            createObject: function (user: MODEL.IAccount): Promise<MODEL.IUser>{
                return new Promise((resolve,reject)=>{               
                });
            }
        }
    });
    return db;
}