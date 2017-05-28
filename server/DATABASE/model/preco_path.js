"use strict";
const MODEL = require("../../constant");
const _ = require('underscore');
module.exports = function (source, type) {
    var db = source.define('preco_path', {
        [MODEL.PID_URL_PATH]: {
            type: type.STRING,
            allowNull: false
        }
    }, {
        classMethods: {
            getObject: function (host, value) {
                return new Promise((resolve, reject) => {
                    if (!host || typeof host.id != 'number' || host.id <= 0) {
                        reject();
                    }
                    else if (!value || typeof value != 'string') {
                        reject();
                    }
                    else {
                        const norm_value = value.toLowerCase().trim();
                        if (norm_value.length == 0) {
                            reject();
                        }
                        else {
                            return db.findOne({
                                where: { [MODEL.PID_URL_HOST_PKEY]: host.id, [MODEL.PID_URL_PATH]: norm_value }
                            }).then((e) => {
                                if (!e) {
                                    reject();
                                }
                                else {
                                    resolve(e);
                                }
                            }, () => { reject(); });
                        }
                    }
                });
            },
            createObject: function (host, value) {
                return new Promise((resolve, reject) => {
                    if (!host || typeof host.id != 'number' || host.id <= 0) {
                        reject();
                    }
                    else if (!value || typeof value != 'string') {
                        reject();
                    }
                    else {
                        const norm_value = value.toLowerCase().trim();
                        if (norm_value.length == 0) {
                            reject();
                        }
                        else {
                            return db.create({ [MODEL.PID_URL_HOST_PKEY]: host.id, [MODEL.PID_URL_PATH]: norm_value }).then((e) => {
                                if (!e) {
                                    reject();
                                }
                                else {
                                    resolve(e);
                                }
                            }, () => { reject(); });
                        }
                    }
                });
            }
        }
    });
    return db;
};
//# sourceMappingURL=preco_path.js.map