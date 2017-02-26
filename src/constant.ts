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

// Worker
export const PID_JOB_ISRUNNING: string = 'jobisrunning';
export const PID_JOB_COMPLETE_STATE: string    = 'jobcompletestate';
// Precognition fields
export const PID_URL_HOST: string      = 'host';
export const PID_URL_PATH: string      = 'pathname';
export const PID_URL_HOST_PKEY: string = 'precoHostId';



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

export interface IFolderWorkerStatus
{
    accountId: number; // account primary Key
    key:       string; // 
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