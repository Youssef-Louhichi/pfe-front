import { Component } from '@angular/core';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.css']
})
export class ConnectionsComponent {

  db_index : number= 1;


  changeIndex(i: number){
    this.db_index = i
  }


}
