export enum DatabaseType {
    MYSQL = "MYSQL",
    ORACLE = "ORACLE",
}

export class Connexion {

    constructor(public id:number,public host:String,public port:String,public username:String,
        public pwd:String,public dbtype:DatabaseType,public createdAt:Date,
        public updatedAt:Date){}

}
