import { Connexion } from "./connexion";
import { Graph } from "./graph";
import { User } from "./user";

export class Rapport {
     constructor(public id: number,public titre: string,public graphs: Graph[],public cnxrapport: Connexion,public user: User
        ) {}
}
