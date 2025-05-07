import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Script } from '../models/script';

@Injectable({
  providedIn: 'root'
})
export class ScriptServiceService {


  private apiUrl = 'http://localhost:8087/api/requete';
  private reqUrl = 'http://localhost:8087/api/reqScript';

  constructor(private http: HttpClient) { }


  executeScript(scriptId: number): Observable<any[][]> {
    const url = `${this.apiUrl}/${scriptId}/execute`;
    return this.http.post<any[][]>(url, {});
  }

  getAll(): Observable<any[]>
  {console.log("s");
    return this.http.get<any[]>(this.reqUrl);
    
  }


  deleteScript(id: number) {
    return this.http.delete(`${this.reqUrl}/${id}`);
  }

  addRequeteToScripts(scriptIds: number[], requeteId: number): Observable<string> {
    const url = `${this.apiUrl}/add-requete/${requeteId}`;
    let params = new HttpParams();
    scriptIds.forEach(id => {
      params = params.append('scriptIds', id.toString());
    });
    return this.http.post(url, null, { params, responseType: 'text' });
  }

  removeRequeteFromScripts(scriptIds: number[], requeteId: number): Observable<string> {
    const url = `${this.apiUrl}/remove-requete/${requeteId}`;
    let params = new HttpParams();
    scriptIds.forEach(id => {
      params = params.append('scriptIds', id.toString());
    });
    return this.http.post(url, null, { params, responseType: 'text' });
  }

  getByUser(id : number): Observable<any[]>
  {
    return this.http.get<any[]>(`${this.reqUrl}/${id}/scripts`);
  }


  
  createScript(script : any ): Observable<Script> {
    return this.http.post<Script>(this.reqUrl, script);
  }


  getReqScriptById(id: number): Observable<Script> {
    return this.http.get<Script>(`${this.reqUrl}/${id}`);
  }



}
