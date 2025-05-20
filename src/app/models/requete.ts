import { DbTable } from "./db-table";
import { Script } from "./script";
import { User } from "./user";

export class Requete {

      constructor(
    public id?: number,
    public sentAt?: Date,
    public sender?: User,
    public content?: string,
    public tableId?: number[],
    public columnId?: number[],
    public aggregation?: any[],
    public groupByColumns?: number[],
    public joinConditions?: any[],
    public filters?: any[],
    public havingConditions?: any[],
    public tableReq?: DbTable,
    public script?: Script[]
  ) {}
}
