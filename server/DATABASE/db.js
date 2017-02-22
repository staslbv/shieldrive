"use strict";
const Sequelize = require("sequelize");
class CDb {
    initialize() {
        try {
            if (process.env.NODE_ENV == 'production') {
                this.sequelize = new Sequelize(process.env.DATABASE_URL, {
                    dialect: 'postgres'
                });
            }
            else {
                this.sequelize = new Sequelize(undefined, undefined, undefined, {
                    "dialect": "sqlite",
                    "storage": __dirname + "/localdb.sqlite"
                });
            }
            this.user = this.sequelize.import(__dirname + '/model/user.js');
            this.account = this.sequelize.import(__dirname + '/model/account.js');
            this.token = this.sequelize.import(__dirname + '/model/token.js');
            this.preco_host = this.sequelize.import(__dirname + '/model/preco_host.js');
            this.preco_path = this.sequelize.import(__dirname + '/model/preco_path.js');
            // FOREIGN KEYS
            this.account.belongsTo(this.user);
            this.user.hasMany(this.account);
            //
            this.token.belongsTo(this.user);
            this.token.belongsTo(this.account);
            this.user.hasMany(this.token);
            //Setup host : path 
            this.preco_path.belongsTo(this.preco_host);
            this.preco_host.hasMany(this.preco_path);
            return this.sequelize.sync({ force: this.FLAG_RESET_SCHEMA });
        }
        catch (e) {
            console.log('db initialization exception: ' + JSON.stringify(e));
            return new Promise((resolve, reject) => {
                reject();
            });
        }
    }
    constructor(reset) {
        this.FLAG_RESET_SCHEMA = reset;
    }
}
exports.CDb = CDb;
