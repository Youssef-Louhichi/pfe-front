import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UsersService {


  private baseUrl = "http://localhost:8087/api/users"
  constructor(private httpclient : HttpClient) { }

  getUsers(): Observable<User[]>
  {
    console.log("ok")
    return this.httpclient.get<User[]>(this.baseUrl);
    
  }
}
