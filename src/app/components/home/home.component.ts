import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Connexion } from 'src/app/models/connexion';
import { UsersService } from 'src/app/services/users.service';
import { ConnectionsComponent } from '../connections/connections.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{

  constructor(private userService:UsersService,private dialog: MatDialog,private router:Router){}

  connexions:Connexion[]

  ngOnInit(): void {
    let id = localStorage.getItem("userId")
    this.userService.getUsersConnexions(Number(id)).subscribe(data =>{
      //console.log(data)
      this.connexions = data
    })
  }

  openPopup(): void {
    const dialogRef = this.dialog.open(ConnectionsComponent, {
      width: '1200px',
      height:'450px',        
    });

    dialogRef.afterClosed().subscribe((data) => {
      if(data)
        this.connexions.push(data)
      })

    
  }


  openConnection(id:number){
    localStorage.removeItem("idConnection")
    localStorage.setItem("idConnection",id.toString())
    this.router.navigate(["/main"])
  }




}
