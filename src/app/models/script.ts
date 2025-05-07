import { Requete } from "./requete";
import { User } from "./user";

export class Script {

    id: number;
    name: string;
    createdAt: Date;
    user: User;
    reqs: Requete[]

    constructor( name: string, createdAt: Date, user: User) {
        
        this.name = name;
        this.createdAt = createdAt;
        this.user = user;
        //this.reqs = reqs
    }
}
