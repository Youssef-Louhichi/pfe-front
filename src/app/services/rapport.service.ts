import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Rapport } from '../models/rapport';
import { Graph } from '../models/graph';

@Injectable({
  providedIn: 'root'
})
export class RapportService {


  private baseUrl = 'http://localhost:8087/api/rapports'


  constructor(private http: HttpClient) {}

  getRapportById(id: number): Observable<Rapport> {
    return this.http.get<Rapport>(`${this.baseUrl}/${id}`);
  }

  createRapport(rapport: Rapport): Observable<Rapport> {
    return this.http.post<Rapport>(this.baseUrl, rapport);
  }
}
