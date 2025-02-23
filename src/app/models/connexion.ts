export enum DatabaseType {
    MYSQL = "MySQL",
    ORACLE = "Oracle",
}

export class Connexion {

    constructor(public id:number,public host:String,public port:String,public username:String,
        public pwd:String,public dbtype:DatabaseType,public createdAt:Date,
        public updatedAt:Date){}

}
