import { Column } from "./column";
import { Database } from "./database";

export class DbTable {
    constructor(public name : String,public database : Database, public columns : Column[]){}
}
