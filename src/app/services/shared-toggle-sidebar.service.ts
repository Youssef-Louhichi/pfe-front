import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedToggleSidebarService {

  constructor() { }

  private collapsed = new BehaviorSubject<boolean>(false);
  collapsed$ = this.collapsed.asObservable();

  setCollapsed(value: boolean) {
    this.collapsed.next(value);
  }
}
