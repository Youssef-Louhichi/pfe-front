import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Connexion } from '../models/connexion';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnexionsService {

 private baseUrl = "http://localhost:8087/api/connexion"
  constructor(private httpclient : HttpClient) { }



  insertConnexion(cnx: Connexion): Observable<Connexion> {
      return this.httpclient.post<Connexion>(this.baseUrl, cnx);
    }

}
