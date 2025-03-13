import { Column } from "./column";
import { Database } from "./database";

export class DbTable {
    constructor(public id:number,public name : String,public database : Database, public columns : Column[]){}
}
