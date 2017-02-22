import Sequelize = require('sequelize');
import  *  as MODEL from   '../../constant';
import  {IUser} from   '../../constant';
import  {IAccount} from   '../../constant';

const _          = require('underscore');
const cryptojs   = require('crypto-js');



module.exports = function(source: Sequelize ,type: Sequelize.DataTypes): any {
    var db = source.define('account',{
        [MODEL.PID_TYPE]:{
            type: type.INTEGER,
            allowNull: false
        },
        [MODEL.PID_KEY]:{
            type: type.STRING,
            allowNull: false
        },
        [MODEL.PID_OBJECTID]:{
            type: type.STRING
        }
    },{
        classMethods:{
          getObject : function (user: IUser, account: IAccount) : Promise<IAccount> {
              return new Promise((resolve,reject)=>{
                  if (typeof user.id != 'number' || typeof account.key != 'string' || typeof account.type == 'undefined'){
                      reject();
                  }else{
                      return db.findOne({
                          where:{
                             [MODEL.PID_USER_PKEY]:user.id,
                             [MODEL.PID_TYPE]:account.type,
                             [MODEL.PID_KEY]:account.key 
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
              });
          },
          createObject: function (user: IUser, account: IAccount) : Promise<IAccount> {
              return new Promise((resolve,reject)=>{
                   if (typeof user.id != 'number' || typeof account.key != 'string' || typeof account.type == 'undefined'){
                       reject();
                   }else{
                       return db.create({
                          [MODEL.PID_USER_PKEY]:user.id,
                          [MODEL.PID_TYPE]:account.type,
                          [MODEL.PID_KEY]:account.key,
                          [MODEL.PID_OBJECTID]:account.objectId  
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