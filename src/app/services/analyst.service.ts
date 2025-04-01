import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Analyst } from '../models/analyst';
import { Connexion } from '../models/connexion';

@Injectable({
  providedIn: 'root'
})
export class AnalystService {

 private baseUrl = "http://localhost:8087/api/analysts"
  constructor(private httpclient : HttpClient) { }

   
   createAnalyst(analyst: Analyst): Observable<Analyst> {
    return this.httpclient.post<Analyst>(this.baseUrl, analyst);
  }


  linkDatabaseToAnalyst(analystId: number, databaseId: number): Observable<any> {
    const url = `${this.baseUrl}/${analystId}/databases/${databaseId}`;
    return this.httpclient.post<any>(url, {});
  }

   getAnalystsConnexions(id: number): Observable<Connexion[]>
    {
      return this.httpclient.get<Connexion[]>(`${this.baseUrl}/${id}/connexions`);
      
    }
}
