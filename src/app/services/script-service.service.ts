import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  addRequeteToScript(scriptId: number, requeteId: number): Observable<string> {
    const url = `${this.apiUrl}/${scriptId}/add-requete/${requeteId}`;
    return this.http.post(url, null, { responseType: 'text' });
  }


}
