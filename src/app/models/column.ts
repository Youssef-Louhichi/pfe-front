import { DbTable } from "./db-table";

export class Column {
    constructor(public name : String , public type : String ,public table : DbTable ){}
}
