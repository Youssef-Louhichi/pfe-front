import { Rapport } from "./rapport";

export class User {
    constructor(public mail:String,public password:String,public identif:number,public rapports:Rapport[],
        public type:string
    ){}

}
