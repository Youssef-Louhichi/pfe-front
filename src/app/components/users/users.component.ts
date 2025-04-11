import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Analyst } from 'src/app/models/analyst';
import { Creator } from 'src/app/models/creator';
import { Database } from 'src/app/models/database';
import { User } from 'src/app/models/user';
import { AnalystService } from 'src/app/services/analyst.service';
import { UsersService } from 'src/app/services/users.service';
import { UserDetailsPopupComponent } from '../user-details-popup/user-details-popup.component';
import { ConnexionsService } from 'src/app/services/connexions.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  user: User;
  useradd: User;
  dbs: Database[] = []
  selectedDb: Database
  newUserform: FormGroup
  showList: boolean = true;

  constructor(private userservice: UsersService, private analystservice: AnalystService, private fb: FormBuilder,private connexionservice:ConnexionsService

  ) { }
  ngOnInit(): void {
    this.newUserform = this.fb.group({
      mail: [,Validators.required],
      password: [,Validators.required],
      databases: [[]],
      rapports: [[]]
    })

    this.getDbs()
  }

  getDbs() {
    let idConnexion = Number(localStorage.getItem("idConnection"))
    let idUser = Number(localStorage.getItem("userId"))

    this.userservice.getUserById(idUser).subscribe(data => {
      this.user = data
      if (data.type == "Creator") {
        let creator = data as Creator
        this.connexionservice.getConnexionDatabases(idConnexion).subscribe(d =>{
          this.dbs = d
          this.selectedDb = this.dbs[0]
          this.getDbAnalysts()


        })  
      }
      else {
        let analyst = data as Analyst
        this.analystservice.getAnalystsDatabasess(analyst.identif).subscribe(d =>{
          this.dbs = d
          this.selectedDb = this.dbs[0]
          this.getDbAnalysts()

        })      
      }


    })
  }

  analysts:Analyst[]=[]

  getDbAnalysts(){
    this.analystservice.getAnalystsByDatabaseId(this.selectedDb.id).subscribe(data =>{
      this.analysts = data
    })
  }


 
  
}
