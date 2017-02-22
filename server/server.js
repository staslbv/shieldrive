"use strict";
const rest_1 = require("./REST/rest");
const db_1 = require("./DATABASE/db");
const URL = require("./helppreco");
const client = new rest_1.CRest();
const db = new db_1.CDb(true);
db.initialize().then(() => {
    rest_1.CRest.pData = db;
    client.Init();
    client.Listen((process.env.PORT || 3000)).then(() => {
        console.log('OnRestClientStartupComplete!');
        const zurl = 'https://www.dropbox.com/home/Please%20wait?preview=contract-services.docx';
        URL.registerUrl(db, zurl).then((e) => {
            console.log('URL DECOMPOSED: ');
            console.log(JSON.stringify(e, null, 4));
        }).catch(() => {
        });
    });
}, (reject) => {
    console.log('Server error, unable to set up database ...');
});
