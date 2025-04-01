import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Creator } from '../models/creator';

@Injectable({
  providedIn: 'root'
})
export class CreatorService {

  private baseUrl = "http://localhost:8087/api/creators"
  constructor(private httpclient : HttpClient) { }

   // Create a new creator
   createCreator(creator: Creator): Observable<Creator> {
    return this.httpclient.post<Creator>(this.baseUrl, creator);
  }
}
