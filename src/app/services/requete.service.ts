import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Requete } from '../models/requete';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {

  private apiUrl = 'http://localhost:8087/api/query/fetch'; 
  private insertUrl = 'http://localhost:8087/api/query/insert';
  private UpdateUrl = 'http://localhost:8087/api/query/update';
  private DeleteUrl = 'http://localhost:8087/api/query/delete';
  private ReqUrl = 'http://localhost:8087/api/requete/user'
  constructor(private http: HttpClient) {}

  fetchTableData(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }



  insertTableData(request: any): Observable<any> {
    return this.http.post<any>(this.insertUrl, request);
  }

  UpdateTableData(request: any): Observable<any> {
    return this.http.post<any>(this.UpdateUrl, request);
  }

  DeleteTableData(request: any): Observable<any> {
    return this.http.post<any>(this.DeleteUrl, request);
  }



  getUserReq(senderId: any): Observable<any> {
    return this.http.get<any>(`${this.ReqUrl}/${senderId}`);
  }
  
}
