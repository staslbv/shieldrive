
import {CRest} from "./REST/rest";
import {CDb}   from "./DATABASE/db";

import * as URL from "./helppreco";

const client : CRest = new CRest();
const db     : CDb   = new CDb(true);




db.initialize().then(()=>{
   CRest.pData = db;
   client.Init();
   client.Listen((process.env.PORT || 3000)).then(()=>{
        console.log('OnRestClientStartupComplete!');  
/*
        const zurl: string = 'https://www.dropbox.com/home/Please%20wait?preview=contract-services.docx';
        URL.registerUrl(db, zurl).then((e)=>{
            console.log('URL DECOMPOSED: ');
            console.log(JSON.stringify(e,null,4));

        }).catch(()=>{

        });

*/
});
},(reject)=>{
    console.log('Server error, unable to set up database ...');
});






