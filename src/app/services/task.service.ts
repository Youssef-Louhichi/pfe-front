import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../models/task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private apiUrl = 'http://localhost:8087/api/tasks'

  constructor(private http: HttpClient) {}

  createTask(dto: any): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}`, dto);
  }

  getTasksForReceiver(receiverId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/receiver/${receiverId}`);
  }

  getTasksFromSender(senderId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/sender/${senderId}`);
  }

  markTaskAsDone(taskId: number): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${taskId}/done`, {});
  }}
