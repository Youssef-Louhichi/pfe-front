import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/models/user';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { UsersService } from 'src/app/services/users.service';
import { HomeComponent } from '../home/home.component';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.css']
})
export class ConnectionsComponent implements OnInit{

  form: FormGroup

  db_type:String = "MySQL"

  constructor(private  fb: FormBuilder,private connexionService:ConnexionsService,private userService:UsersService,
    private dialogRef: MatDialogRef<HomeComponent>){}

  creator:User

  ngOnInit(): void {

    let idUser = Number(localStorage.getItem("userId"))

    this.userService.getUserById(idUser).subscribe(data => this.creator = data)
    this.form = this.fb.group({
      host: [''],
      port:[],
      username:[''],
      password:[''],
      dbtype:['MySQL'],
      creator:[]
      
    })

  }



  changeIndex(i: number){
    if(i ==1){
      this.form.reset()
      this.form.get("dbtype").setValue("MySQL")
      this.db_type="MySQL"
    }
    if (i==2){
      this.form.reset()
      this.form.get("dbtype").setValue("Oracle")
      this.db_type="Oracle"
      
    }

  }

  insertConnection(){
    this.form.get("creator").setValue(this.creator)
    console.log(this.form.value)
    this.connexionService.insertConnexion(this.form.value).subscribe(data =>{
      this.dialogRef.close(data)
    })
  }


}
