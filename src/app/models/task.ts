import { User } from "./user";

export class Task {
    public id?: number;
  public description: string;
  public done: boolean;
  public createdAt?: string;
  public sender: User;
  public receiver: User;
}
