import { User } from "./user";
import { Connexion } from "./connexion";

export enum DatabaseType {
    MYSQL = "MYSQL",
    ORACLE = "ORACLE",
}

export class Database {
    constructor(public id: number,public name: string,public dbtype: DatabaseType,public connexion: Connexion,
        public users: User[],public createdAt: Date,public updatedAt: Date
    ) {}
}
