import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Requete } from '../models/requete';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequeteService {

  private apiUrl = 'http://localhost:8087/api/query/fetch'; 

  constructor(private http: HttpClient) {}

  fetchTableData(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }
}
