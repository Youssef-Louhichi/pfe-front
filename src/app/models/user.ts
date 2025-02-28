import { Database } from "./database";

export class User {
    constructor(public mail:String,public password:String,public databases:Database[],public identif:number){}

}
