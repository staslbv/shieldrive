"use strict";
const rest_1 = require("./REST/rest");
const db_1 = require("./DATABASE/db");
const client = new rest_1.CRest();
const db = new db_1.CDb((process.env.NODE_ENV != 'production'));
db.initialize().then(() => {
    rest_1.CRest.pData = db;
    client.Init();
    client.Listen((process.env.PORT || 3000)).then(() => {
        console.log('OnRestClientStartupComplete!');
    });
}, (reject) => {
    console.log('Server error, unable to set up database ...');
});
