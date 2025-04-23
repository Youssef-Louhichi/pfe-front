import { DbTable } from "./db-table";
import { User } from "./user";

export class Requete {

    constructor(public sentAt: Date,public sender : User , public content : String,public tableReq : DbTable){}
}
