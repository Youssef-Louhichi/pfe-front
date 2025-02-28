import { Component, OnInit } from '@angular/core';
import { Database } from 'src/app/models/database';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{

  constructor(private connexionService:ConnexionsService,private userservice:UsersService){}

  databases:Database[]

  ngOnInit(): void {
    
    this.userservice.getUserById(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.databases = data.databases
    })

  }



}
