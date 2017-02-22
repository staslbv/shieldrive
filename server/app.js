"use strict";
const constant_1 = require("./constant");
const URL = require("url");
var e = constant_1.ACCOUNT_TYPE.DRIVE;
console.log(typeof e);
console.log(e);
const zurl = 'https://www.dropbox.com/home/Please%20wait?preview=contract-services.docx';
console.log('parse: host:  ' + URL.parse(zurl).host);
console.log('parse: pathname:  ' + decodeURIComponent(URL.parse(zurl).pathname));
