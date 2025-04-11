import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Analyst } from '../models/analyst';
import { Connexion } from '../models/connexion';
import { Database } from '../models/database';

@Injectable({
  providedIn: 'root'
})
export class AnalystService {

 private baseUrl = "http://localhost:8087/api/analysts"
  constructor(private httpclient : HttpClient) { }

   
   createAnalyst(analyst: Analyst): Observable<Analyst> {
    return this.httpclient.post<Analyst>(this.baseUrl, analyst);
  }


  linkDatabaseToAnalyst(analystId: number, payload: any): Observable<any> {
    const url = `${this.baseUrl}/${analystId}/relations`;
    return this.httpclient.post<any>(url, payload);
  }

   getAnalystsConnexions(id: number): Observable<Connexion[]>
    {
      return this.httpclient.get<Connexion[]>(`${this.baseUrl}/${id}/connexions`);
      
    }

    getAnalystsDatabasess(id: number): Observable<Database[]>
    {
      return this.httpclient.get<Database[]>(`${this.baseUrl}/${id}/databases`);
      
    }

    getAnalystsByDatabaseId(id: number): Observable<Analyst[]>
    {
      return this.httpclient.get<Analyst[]>(`${this.baseUrl}/database/${id}`);
      
    }

    deleteAnalystRelation(id: number):Observable<Boolean>
    {
      return this.httpclient.delete<Boolean>(`${this.baseUrl}/${id}/relations`);

    }
}
