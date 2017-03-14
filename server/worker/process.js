"use strict";
const db_1 = require("../DATABASE/db");
const bkworker_1 = require("./bkworker");
const folder_1 = require("./folder");
const rest_1 = require("../REST/rest");
const FIELD = require("../constant");
module.exports = function (input, done) {
    try {
        FIELD.Log.log('ENTRY POINT OK ...');
        var dataConnection = new db_1.CDb(false);
        dataConnection.initialize()
            .then((e) => {
            rest_1.CRest.pData = dataConnection;
            const worker = new bkworker_1.BackgndWorker(rest_1.CRest.pData, input.user, input.entryId, input.folder.color);
            const source = new folder_1.CGFolderSynk(input.user, input.entryId, input.metadata);
            source.shieldObj = input.folder;
            worker.statusObj = input.context;
            return source.batchProtect(input.folder, worker)
                .then(() => done())
                .catch(() => done());
        })
            .catch(() => {
            done();
        });
    }
    catch (Error) {
        FIELD.Log.log('ERROR: ' + Error);
        this.kill();
    }
};
