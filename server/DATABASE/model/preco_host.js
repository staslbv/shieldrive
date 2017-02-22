"use strict";
const MODEL = require("../../constant");
const _ = require('underscore');
module.exports = function (source, type) {
    var db = source.define('preco_host', {
        [MODEL.PID_URL_HOST]: {
            type: type.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        classMethods: {
            getObject: function (value) {
                return new Promise((resolve, reject) => {
                    if (!value || typeof value != 'string') {
                        reject();
                    }
                    else {
                        const norm_value = value.toLowerCase().trim();
                        if (norm_value.length <= 0) {
                            reject();
                        }
                        else {
                            return db.findOne({
                                where: {
                                    [MODEL.PID_URL_HOST]: norm_value
                                }
                            }).then((e) => {
                                if (!e) {
                                    reject();
                                }
                                else {
                                    resolve(e);
                                }
                            }, () => {
                                reject();
                            });
                        }
                    }
                });
            },
            createObject: function (value) {
                return new Promise((resolve, reject) => {
                    if (!value || typeof value != 'string') {
                        reject();
                    }
                    else {
                        const norm_value = value.toLowerCase().trim();
                        if (norm_value.length <= 0) {
                            reject();
                        }
                        else {
                            return db.create({ [MODEL.PID_URL_HOST]: norm_value }).then((e) => {
                                if (!e) {
                                    reject();
                                }
                                else {
                                    resolve(e);
                                }
                            }, () => {
                                reject();
                            });
                        }
                    }
                });
            }
        }
    });
    return db;
};
