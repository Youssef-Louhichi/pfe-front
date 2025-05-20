import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

private baseUrl = "http://localhost:8087/api/database"
  constructor(private httpclient : HttpClient) { }

   getStructure(id: number): Observable<any> {
    return this.httpclient.get<any>(this.baseUrl+"/"+id+"/structure");
  }

getDashboardForUser(creatorId: number, cnxId: number): Observable<any[]> {
  const url = `${this.baseUrl}/user?creatorId=${creatorId}&cnxId=${cnxId}`;
  return this.httpclient.get<any[]>(url);
}


}
