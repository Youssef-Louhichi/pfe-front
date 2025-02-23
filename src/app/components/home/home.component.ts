import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Connexion } from 'src/app/models/connexion';
import { UsersService } from 'src/app/services/users.service';
import { ConnectionsComponent } from '../connections/connections.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{

  constructor(private userService:UsersService,private dialog: MatDialog){}

  connexions:Connexion[]

  ngOnInit(): void {
    this.userService.getUsersConnexions(1).subscribe(data =>{
      //console.log(data)
      this.connexions = data
    })
  }

  openPopup(): void {
    const dialogRef = this.dialog.open(ConnectionsComponent, {
      width: '1200px',
      height:'450px',        
    });

    
  }




}
