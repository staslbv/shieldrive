export var PID_ID: string            = 'id';
export var PID_EMAIL: string         = 'email';
export var PID_TYPE: string          = 'type';
export var PID_KEY: string           = 'key';
export var PID_TOKEN_HASH: string    = 'token_hash';
export var PID_USER_PKEY: string     = 'userId';
export var PID_ACCOUNT_PKEY: string  = 'accountId';
export var PID_OBJECTID: string      = 'objectId';

export var PID_TOKEN_TYPE: string    = 'token_type';
export var PID_ACCESS_TOKEN: string  = 'access_token';
export var PID_CLIENT_ID: string     = 'client_id';
export var PID_UID: string           = 'uid';

// Precognition fields
export var PID_URL_HOST: string      = 'host';
export var PID_URL_PATH: string      = 'pathname';
export var PID_URL_HOST_PKEY: string = 'precoHostId';

export enum ACCOUNT_TYPE {
    SYSTEM,
    SHIELDOX,
    DROPBOX,
    DRIVE
};

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