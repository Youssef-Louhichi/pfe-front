import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User } from '../models/user';
import { Connexion } from '../models/connexion';
import { Rapport } from '../models/rapport';

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
   getUserById(id: number): Observable<User> {
    return this.httpclient.get<User>(`${this.baseUrl}/${id}`);
  }

  getUserRapports(id: number): Observable<Rapport[]> {
    return this.httpclient.get<Rapport[]>(`${this.baseUrl}/${id}/rapports`);
  }

  updateUser(id: number, updatedUser: User): Observable<User> {
    const updateData = {
      mail: updatedUser.mail,
      password: updatedUser.password
    };
    
    return this.httpclient.put<User>(`${this.baseUrl}/${id}`, updateData);
  }


  verifyPassword(userId: number, password: string): Observable<boolean> {
    return this.httpclient.post<{ isValid: boolean }>(`${this.baseUrl}/verify-password`, { 
      userId, 
      password 
    }).pipe(
      map(response => response.isValid)
    );
  }
  deleteUser(id: number): Observable<void> {
    return this.httpclient.delete<void>(`${this.baseUrl}/${id}`);
  }

 

  getUserByMail(mail:string): Observable<User[]> 
  {
    return this.httpclient.get<User[]>(`${this.baseUrl}/getmail?mail=${mail}`)
  }

  
  

  login(l:string,p:string):Observable<any>{
    return this.httpclient.post<User>(this.baseUrl+`/login`,{mail:l,password:p})
  }

  
  logout() {
    return this.httpclient.post(this.baseUrl +"/logout", {}, { responseType: 'text' });
  }

}
