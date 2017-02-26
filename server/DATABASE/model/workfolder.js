"use strict";
const MODEL = require("../../constant");
const _ = require('underscore');
const cryptojs = require('crypto-js');
module.exports = function (source, type) {
    var db = source.define('workfolder', {
        [MODEL.PID_KEY]: {
            type: type.STRING,
            allowNull: false,
            unique: true
        } //,
    }, {
        classMethods: {
            getObject: function (user) {
                return new Promise((resolve, reject) => {
                });
            },
            createObject: function (user) {
                return new Promise((resolve, reject) => {
                });
            }
        }
    });
    return db;
};
