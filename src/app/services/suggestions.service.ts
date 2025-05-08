import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuggestionsService {

 private baseUrl = "http://127.0.0.1:5000/api/suggestions"
  constructor(private httpclient : HttpClient) { }



  getSuggestions(payload: any): Observable<any> {
      return this.httpclient.post<any>(this.baseUrl, payload);
    }}
