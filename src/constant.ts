export const PID_ID: string            = 'id';
export const PID_EMAIL: string         = 'email';
export const PID_TYPE: string          = 'type';
export const PID_KEY: string           = 'key';
export const PID_TOKEN_HASH: string    = 'token_hash';
export const PID_USER_PKEY: string     = 'userId';
export const PID_ACCOUNT_PKEY: string  = 'accountId';
export const PID_OBJECTID: string      = 'objectId';

export const PID_TOKEN_TYPE: string    = 'token_type';
export const PID_ACCESS_TOKEN: string  = 'access_token';
export const PID_CLIENT_ID: string     = 'client_id';
export const PID_UID: string           = 'uid';
export const PID_CLOUDKEY: string      = 'cloudKey';
// Worker
export const PID_JOB_FLAG_BACKGND: string = 'fbackGnd';
export const PID_JOB_FLAG_CANCELPENDING: string     = 'fcancelPending';
export const PID_JOB_FLAG_PROTECT: string     = 'fprotect';
export const PID_JOB_FLAG_RUNNING: string     = 'frunning';
export const PID_JOB_PROCESS_ID: string     = 'processId';
// Precognition fields
export const PID_URL_HOST: string      = 'host';
export const PID_URL_PATH: string      = 'pathname';
export const PID_URL_HOST_PKEY: string = 'precoHostId';


export const Log : any = new (require('le_node'))({
    token: '68d9bd5b-3a90-4fe1-a1e8-329df5f1f2ec'
});



export class ICountArg{
    MAX_COUNT: number = 5;
    count: number;
    completed: boolean;
    body: any;
    sleeptime: number;
    get sleep(): number{
        this.sleeptime += 1;
        return 1000 *  this.sleeptime;
    }
    constructor(){
        this.count = this.MAX_COUNT;
        this.completed = false;
        this.body = undefined;
        this.sleeptime = 0;
    }
}

export enum ACCOUNT_TYPE {
    SYSTEM,
    SHIELDOX,
    DROPBOX,
    DRIVE
};

export enum WORKER_COMPLETE_STATE{
    STATE_PENDING,
    STATUS_SUCCESS,
    STATUS_ERROR
}

export interface IUser{
    id:        number;
    email:     string;
    objectId:  string;
};

export interface IAccount{
    id:        number;
    userId:    number;
    type:      ACCOUNT_TYPE;
    key:       string;  
    objectId:  string;  
}

export interface IUserAccount{
    user: IUser;
    account: IAccount;
    token: IToken;
}

export interface ILoginResponse{
    authorization: string;
    account: IUserAccount;
}

export interface ILoginInfo{
    account: IUserAccount,
    token: IToken
}

export interface IToken{
    id:           number;
    userId:       number;
    accountId:    number;
    access_token: string;
    token_hash:   string;
    token_type:   string;
    client_id:    string;
    uid:          string;
}

export interface IContentBuffer{
    id: string;
    contentType: string;
    data: string;
}

export interface IDecryptArgs{
    fileName: string;
    data: string;
}

export interface IConvertArgs{
    data: IDecryptArgs;
}

export interface IFolderWorkerStatus
{
    id:             number;
    accountId:      number; // account primary Key
    cloudKey:       string; // cloud key
    fbackGnd:       boolean;
    fcancelPending: boolean;
    fprotect:       boolean;
    frunning:       boolean;
    processId:      number;
}

export interface IFolderWorkerRequestResponse
{
    enable: boolean;
    context : IFolderWorkerStatus
}



// PRECOGNITION LEVELS

export interface IUrlHost
{
    id: number;
    host: string;
}

export interface IUrlPath
{
    id: number;
    precoHostId: number;
    pathname: string;
}

export interface IUrlInfo{
    host: IUrlHost,
    path: IUrlPath
}