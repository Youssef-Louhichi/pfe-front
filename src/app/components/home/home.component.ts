import { Component, OnInit } from '@angular/core';
import { Connexion } from 'src/app/models/connexion';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{

  constructor(private userService:UsersService){}

  connexions:Connexion[]

  ngOnInit(): void {
    this.userService.getUsersConnexions(1).subscribe(data =>{
      //console.log(data)
      this.connexions = data
    })
  }




}
