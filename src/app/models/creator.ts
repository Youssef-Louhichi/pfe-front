import { User } from "./user";
import { Connexion } from "./connexion";
import { Rapport } from "./rapport";

export class Creator extends User {
  connexions: Connexion[];

  constructor(
    identif:number,
    mail: string,
    password: string,
    connexions: Connexion[],
    rapports:Rapport[],
    type:string
  ) {
    super(mail, password,identif,rapports,type);
    this.connexions = connexions;
  }
}
