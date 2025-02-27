import { Component, OnInit } from '@angular/core';
import { Database } from 'src/app/models/database';
import { ConnexionsService } from 'src/app/services/connexions.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{

  constructor(private connexionService:ConnexionsService){}

  databases:Database[]

  ngOnInit(): void {
    let idC = Number(localStorage.getItem("idConnection"))
    let idU = Number(localStorage.getItem("userId"))
    this.connexionService.getConnexionDatabases(idC).subscribe(data =>{
      this.databases=data
    })

  }



}
