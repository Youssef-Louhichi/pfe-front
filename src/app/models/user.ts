import { Database } from "./database";
import { Rapport } from "./rapport";

export class User {
    constructor(public mail:String,public password:String,public databases:Database[],public identif:number,public rapports:Rapport[]){}

}
