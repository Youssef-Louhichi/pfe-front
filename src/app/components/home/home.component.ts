import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Connexion } from 'src/app/models/connexion';
import { UsersService } from 'src/app/services/users.service';
import { ConnectionsComponent } from '../connections/connections.component';
import { Router } from '@angular/router';
import { Creator } from 'src/app/models/creator';
import { User } from 'src/app/models/user';
import { AnalystService } from 'src/app/services/analyst.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{

  constructor(private userService:UsersService,private analystservice:AnalystService,private dialog: MatDialog,private router:Router){}

  connexions:Connexion[]
  user:User

  ngOnInit(): void {
    let id = localStorage.getItem("userId")
    this.userService.getUserById(Number(id)).subscribe(data =>{
      //console.log(data)
      this.user = data
      if(data.type == "Creator"){
        let creator = data as Creator
        this.connexions = creator.connexions
        if(this.connexions.length == 0){
          this.openPopup()
        }
      }
      else{
        this.analystservice.getAnalystsConnexions(Number(id)).subscribe(data2=>{
          this.connexions = data2
        })
      }
    })
  }

  openPopup(): void {
    const dialogRef = this.dialog.open(ConnectionsComponent, {
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      hasBackdrop: true,
      width: '75vw',
      maxHeight: '100vh'
    }
          
    );

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
