


import {CRest} from "./REST/rest";
import {CDb}   from "./DATABASE/db";


const client : CRest = new CRest();
const db     : CDb   = new CDb(false);//(process.env.NODE_ENV != 'production'));


db.initialize().then(()=>{
   CRest.pData = db;
   client.Init();
   client.Listen((process.env.PORT || 3000)).then(()=>{
        console.log('OnRestClientStartupComplete!');  

});
},(reject)=>{
    console.log('Server error, unable to set up database ...');
});





