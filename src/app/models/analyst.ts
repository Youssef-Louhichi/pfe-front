import { Database } from "./database";
import { Rapport } from "./rapport";
import { User } from "./user";

export class Analyst extends User {
  databases: Database[];

  constructor(
    identif:number,
    mail: string,
    password: string,
    databases: Database[],
    rapports:Rapport[],
    type:string
  ) {
    super(mail, password,identif,rapports,type);
    this.databases = databases;
  }
}
