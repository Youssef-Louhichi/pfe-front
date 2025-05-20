import { DbTable } from "./db-table";

export class Column {
    constructor(public id:number,public name : string , public type : string ,public table : DbTable ){}
}
