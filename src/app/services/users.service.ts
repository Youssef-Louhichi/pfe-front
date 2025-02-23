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


   // Get user by ID
   getUserById(id: number): Observable<User> {
    return this.httpclient.get<User>(`${this.baseUrl}/${id}`);
  }

  // Create a new user
  createUser(user: User): Observable<User> {
    return this.httpclient.post<User>(this.baseUrl, user);
  }

  // Update an existing user
  updateUser(id: number, updatedUser: User): Observable<User> {
    return this.httpclient.put<User>(`${this.baseUrl}/${id}`, updatedUser);
  }

  // Delete a user by ID
  deleteUser(id: number): Observable<void> {
    return this.httpclient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
