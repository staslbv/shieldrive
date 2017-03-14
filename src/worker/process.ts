
import {CDb}           from '../DATABASE/db'
import {BackgndWorker} from './bkworker'
import {CGFolderSynk}  from './folder'
import {CRest}         from '../REST/rest'

import * as FIELD from '../constant'

module.exports = function (input,done){
    try {
        FIELD.Log.log('ENTRY POINT OK ...');
        var dataConnection: CDb = new CDb(false);
        dataConnection.initialize()
            .then((e) => {
                CRest.pData = dataConnection;
                const worker: BackgndWorker = new BackgndWorker(CRest.pData, input.user, input.entryId, input.folder.color);
                const source: CGFolderSynk  = new CGFolderSynk(
                    input.user,
                    input.entryId,
                    input.metadata
                );
                source.shieldObj = input.folder;
                worker.statusObj = input.context;
                return source.batchProtect(input.folder, worker)
                    .then(() => done())
                    .catch(() => done());
            })
            .catch(() => {
                done();
            });
    } catch (Error) {
        FIELD.Log.log('ERROR: ' + Error);
        this.kill();
    }
}


