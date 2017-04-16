import Sequelize = require('sequelize');

const DATABESE_NAME: string = "scuser";



export class CDb{
    FLAG_RESET_SCHEMA: boolean;
    sequelize:         Sequelize;
    user:              any;
    account:           any;
    token:             any;
    workfolder:        any;
    preco_host:        any;
    preco_path:        any;
    initialize():Promise<any>{
        try{
           // if (process.env.NODE_ENV == 'production'){
           //     this.sequelize = new Sequelize(process.env.DATABASE_URL,{
    	   //           dialect: 'postgres'
           //       });
                  
          //  } else {
            
            /*
            this.sequelize = new Sequelize(DATABESE_NAME, "scnull@q631ozbdob","Osafe1341",{
		         "dialect" : "mssql",
		         "port" : 1433,
		         "host" : "q631ozbdob.database.windows.net",
		        "dialectOptions": {
		 	           "encrypt": true,
		 	           "loginTimeout": 30
		            }});

                    */            
          
             this.sequelize = new Sequelize(undefined,undefined,undefined,{
                    "dialect": "sqlite",
                    "storage": __dirname + "/localdbv4.sqlite",
                    "logging": false
             });
            
             this.user       = this.sequelize.import(__dirname + '/model/user.js');
             this.account    = this.sequelize.import(__dirname + '/model/account.js');
             this.token      = this.sequelize.import(__dirname + '/model/token.js');
             this.workfolder = this.sequelize.import(__dirname + '/model/workfolder.js');

           //  this.preco_host = this.sequelize.import(__dirname + '/model/preco_host.js');
           //  this.preco_path = this.sequelize.import(__dirname + '/model/preco_path.js');

             // FOREIGN KEYS
             this.account.belongsTo(this.user);
             this.user.hasMany(this.account);
             //
             this.token.belongsTo(this.user);
             this.token.belongsTo(this.account);
             this.user.hasMany(this.token);
             //
             this.workfolder.belongsTo(this.account);
             this.account.hasMany(this.workfolder);

             //Setup host : path 
         //   this.preco_path.belongsTo(this.preco_host);
         //   this.preco_host.hasMany(this.preco_path);

            
             return this.sequelize.sync({force: this.FLAG_RESET_SCHEMA})

        }catch(e){
           
            return new Promise((resolve,reject)=>{
                reject();
            });
        }
    }

    constructor(reset: boolean){
       
        this.FLAG_RESET_SCHEMA = reset;

    }
}