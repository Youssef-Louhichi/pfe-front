import { User } from "./user";
import { Connexion } from "./connexion";
import { DbTable } from "./db-table";
import { Analyst } from "./analyst";

export enum DatabaseType {
    MYSQL = "MySQL",
    ORACLE = "Oracle",
}

export class Database {
    constructor(public id: number,public name: string,public dbtype: DatabaseType,public connexion: Connexion,
        public analysts: Analyst[],public createdAt: Date,public updatedAt: Date,public tables:DbTable[]
    ) {}
}
