import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Analyst } from 'src/app/models/analyst';
import { Creator } from 'src/app/models/creator';
import { Database } from 'src/app/models/database';
import { User } from 'src/app/models/user';
import { AnalystService } from 'src/app/services/analyst.service';
import { UsersService } from 'src/app/services/users.service';
import { UserDetailsPopupComponent } from '../user-details-popup/user-details-popup.component';

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

  constructor(private userservice: UsersService, private analystservice: AnalystService, private fb: FormBuilder,
    private dialog: MatDialog
  ) { }
  ngOnInit(): void {
    this.newUserform = this.fb.group({
      mail: [],
      password: [],
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
      console.log(data)
      if (data.type == "Creator") {
        let creator = data as Creator
        this.dbs = creator.connexions.find(cnx => cnx.id == idConnexion).databases
      }
      else {
        let analyst = data as Analyst
        this.dbs = analyst.databases.filter(db => db.connexion.id == idConnexion)
      }


      this.selectedDb = this.dbs[0]
      console.log(this.selectedDb)
    })
  }


  isExistingUser: boolean = true

  toggleForm() {
    this.isExistingUser = !this.isExistingUser;
  }





  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userservice.deleteUser(id).subscribe(() => {
      });
    }
  }



  filteredUsers: User[] = [];

  filterUsers(mail: string) {
    if (this.isEmailComplete(mail)) {
      this.userservice.getUserByMail(mail).subscribe(data => {
        if (data[0])
          this.filteredUsers = data
      })
    }
    else {
      this.filteredUsers = [];
    }
  }

  isEmailComplete(mail: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(mail);
  }


  addUser() {

    if (this.filteredUsers.length != 0) {
      if (this.selectedDb.analysts.filter(u => u.identif == this.filteredUsers[0].identif).length == 0)
        this.analystservice.linkDatabaseToAnalyst(this.filteredUsers[0].identif, this.selectedDb.id).subscribe(data => {
          if (data.message == "Database linked successfully") {
            this.selectedDb.analysts.push(this.filteredUsers[0] as Analyst)
            this.filteredUsers = []
          }
        })
    }

  }


  generatePwd() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newUserform.get("password").setValue(password)

  }
  addNewUser() {
    this.analystservice.createAnalyst(this.newUserform.value).subscribe(data => {
      this.analystservice.linkDatabaseToAnalyst(data.identif, this.selectedDb.id).subscribe(data2 => {
        if (data2.message == "Database linked successfully") {
          this.selectedDb.analysts.push(data)
          this.newUserform.reset()
        }
      })
    })
  }

  showUserDetails(user: User): void {
    this.dialog.open(UserDetailsPopupComponent, {
        width: '420px',
        panelClass: 'user-details-dialog',
        data: user,
        autoFocus: false,
        disableClose: false
    });
}
  
}
