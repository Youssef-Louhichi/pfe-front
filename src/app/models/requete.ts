import { DbTable } from "./db-table";
import { Script } from "./script";
import { User } from "./user";

export class Requete {

    constructor(public id : number,public sentAt: Date,public sender : User , public content : String,public tableReq : DbTable, public script : Script[]){}
}
