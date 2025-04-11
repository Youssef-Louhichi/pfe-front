import { Rapport } from "./rapport";
import { User } from "./user";

export class Analyst extends User {
  relations: any[];

  constructor(
    identif:number,
    mail: string,
    password: string,
    relations: any[],
    rapports:Rapport[],
    type:string
  ) {
    super(mail, password,identif,rapports,type);
    this.relations = relations;
  }
}
