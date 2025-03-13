import { User } from "./user";
import { Connexion } from "./connexion";
import { DbTable } from "./db-table";

export enum DatabaseType {
    MYSQL = "MySQL",
    ORACLE = "Oracle",
}

export class Database {
    constructor(public id: number,public name: string,public dbtype: DatabaseType,public connexion: Connexion,
        public users: User[],public createdAt: Date,public updatedAt: Date,public tables:DbTable[]
    ) {}
}
