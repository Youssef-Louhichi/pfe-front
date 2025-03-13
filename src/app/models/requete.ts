import { DbTable } from "./db-table";
import { User } from "./user";

export class Requete {

    constructor(public sentAt: String,public sender : User , public content : String,public tableReq : DbTable){}
}
