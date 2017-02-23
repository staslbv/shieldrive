import {IUser}           from './constant';
import {IAccount}        from './constant';
import {IToken}          from './constant';
import {IUserAccount}    from './constant';
import {ILoginResponse}  from './constant';
import {ILoginInfo}      from './constant';
import {ACCOUNT_TYPE}    from './constant';

import {CDb}             from './DATABASE/db';
import  *  as MODEL from   './constant';

const request           = require('request');
const cryptojs          = require('crypto-js');

export const SHIELDOX_BASE_URL : string = "https://api.shieldox.com/api";

export function registerUser(db: CDb, user: IUser): Promise<IUser>{
  return new Promise((resolve,reject)=>{
      return db.user.getObject(user)
      .then((user)=>{
          resolve(user);
      },(error)=>{
          return db.user.createObject(user);
      }).then((user)=>{
          resolve(user);
      }).catch((e)=>{
          reject();
      });
  });
}

export function registerAccount(db: CDb, user: IUser, account: IAccount): Promise<IUserAccount>{
    return new Promise((resolve,reject)=>
    {
        var _userRef: IUser;
        return registerUser(db,user).then((u)=>{
            _userRef = u;
            return db.account.getObject(_userRef, account).then((e)=>{
                resolve({user: _userRef, account: e});
            },()=>{
                return db.account.createObject(_userRef,account).then((e)=>{
                    resolve({user: _userRef, account: e});
                },()=>{
                    reject();
                });
            });
        },()=>{
            reject();
        });
    });
}

export function registerTokenAccount(db: CDb, user: IUser, account: IAccount, token: IToken ): Promise<IUserAccount>
{
    var user_account: IUserAccount;
    return new Promise((resolve,reject)=>{
        return registerUser(db,user).then((e)=>{
            return registerAccount(db,e, account).then((useracc)=>{
                user_account = useracc;
                return db.token.getObject(useracc).then((result)=>{
                     resolve(result);
                },()=>{
                    user_account.token = token;
                    return db.token.createObject(user_account).then((e)=>{
                        resolve(e);
                    }).catch(()=>{
                        reject();
                    });
                });
            },(error)=>{
                reject();
            });
        },(error)=>{
            reject();
        });
    });
}

export function accType2ShieldoxType(type: ACCOUNT_TYPE): number {
   switch(type){
       case ACCOUNT_TYPE.DROPBOX:
          return 3;
       case ACCOUNT_TYPE.DRIVE:
          return 2;
       default:
          return 2;
   }
}

function SUCCEEDED(error: any, response: any): boolean {
    if (null == response || typeof response == 'undefined') {
        return false;
    }
    var code = response.statusCode;
    if (typeof code == 'number') {
        return ((code >= 200) && (code < 300));
    }
    return false;
}

export function registerShieldAccount(db: CDb, account: IUserAccount): Promise<IUserAccount>{
    return new Promise((resolve,reject)=>{
        request({
            url: SHIELDOX_BASE_URL + '/user/SignwAcc',
            method: 'POST',
            json:{
               owner: {email: account.user.email},
               token: {data:  account.token.token_hash},
               accountId: account.account.key,
               type: accType2ShieldoxType(account.account.type)
            }
        },(error: any, response: any, body: any)=>{
            if (!SUCCEEDED(error,response)){
                reject();
            }else{
                resolve(body);
            }
        });
    });
}

export function registerShieldAccountArgs(db: CDb, account: IUserAccount, item: any): Promise<IUserAccount> {
    return new Promise((resolve,reject)=>{
       const email: string           = item.email;
       const password: string        = item.password;
       const objectId: string        = item.objectId;
       account.account.objectId      = item.account.objectId;
       return db.account.update({
           [MODEL.PID_OBJECTID]: account.account.objectId },{where:{ [MODEL.PID_ID]: account.account.id }})
           .then((flag)=>{
           const sysacc: any = {
               [MODEL.PID_TYPE]: ACCOUNT_TYPE.SYSTEM,
               [MODEL.PID_OBJECTID]: objectId,
               [MODEL.PID_KEY]: email 
           };
           const systoken: any = {
               [MODEL.PID_ACCESS_TOKEN]: new Buffer(email + ':'+ password).toString('base64')
           };
           return registerTokenAccount(db,account.user,sysacc, systoken).then((e)=>{
               resolve(e);
           },()=>reject());          
       },(e)=>{
           reject();
       });
    });
}

export function registerShieldTokenAccount(db: CDb, user: IUser, account: IAccount, token: IToken): Promise<ILoginResponse> {
    var _account: IUserAccount 
    return new Promise((resolve,reject)=>{
        return registerTokenAccount(db,user,account,token).then((useracc)=>{
           return registerShieldAccount(db,useracc).then((item)=>{
               _account = useracc;
               return registerShieldAccountArgs(db,useracc,item).then((e)=>{
                   resolve({
                       authorization: 'Basic ' + e.token.access_token,
                       account: _account 
                   });
               }).catch(()=>{
                   reject();
               });
           },()=>{
               reject();
           });
        },()=>{
            reject();
        });
    });
}

export function authorize(db: CDb, authorization: string, accId: string): Promise<ILoginInfo>{
    return new Promise((resolve,reject)=>{
        console.log('searching: ' + authorization + ' : ' + accId);
        var shieldoxToken: IToken;   // auth for shieldox service
        var token:         IToken;   // auth for cloud service
        var user:          IUser;    // system user
        var account:       IAccount; // cloud account
        if (typeof authorization == 'undefined' || typeof accId == 'undefined'){
            reject();
        }else{
            let nauth  = authorization.split(' ');
            if (nauth.length != 2 || nauth[0].trim() != 'Basic'){ reject();
            }else{
                return db.token.findOne({where:{[MODEL.PID_TOKEN_HASH]: cryptojs.MD5(nauth[1].trim()).toString()}
                }).then((e:IToken)=>{
                   if (!e){ reject(); // can not locate specifit auth info
                   }else{ shieldoxToken = e;
                      return db.user.findOne({where:{[MODEL.PID_ID]:e.userId}}).then((e:IUser)=>{
                          if (!e){ reject(); // can not locate parent user
                          }else{ user = e;
                              return db.account.findOne({where:{[MODEL.PID_USER_PKEY]:user.id,[MODEL.PID_KEY]:  accId}})
                              .then((e: IAccount)=>{
                                  if (!e){ reject();
                                  }else{ account = e;
                                      return db.token.findOne({where:{[MODEL.PID_USER_PKEY]: user.id,[MODEL.PID_ACCOUNT_PKEY]: account.id}})
                                      .then((e: IToken)=>{
                                          if (!e){ reject();
                                          }else{ token = e;
                                              resolve({token: shieldoxToken, account: {user: user, account: account, token: token}});
                                          }
                                      }); 
                                  }
                              });
                          }
                      });
                   }
                }).catch(()=>{ reject();});
            }
        }
    });
}

