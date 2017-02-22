
import {ACCOUNT_TYPE}  from './constant';

import * as URL from 'url';

var e: ACCOUNT_TYPE = ACCOUNT_TYPE.DRIVE;

console.log(typeof e);

console.log(e);

const zurl: string = 'https://www.dropbox.com/home/Please%20wait?preview=contract-services.docx';


console.log('parse: host:  '   + URL.parse(zurl).host);

console.log('parse: pathname:  ' + decodeURIComponent(URL.parse(zurl).pathname));