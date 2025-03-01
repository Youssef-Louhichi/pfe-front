import { Component, OnInit } from '@angular/core';
import { Database } from 'src/app/models/database';
import { User } from 'src/app/models/user';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit{

  user : User;
  users: User[] = [];
  useradd: User ;
  dbs:Database[] = []
  selectedDb : Database 

  constructor(private userservice : UsersService){}
  ngOnInit(): void {
    this.getDbs()
    this.getUsers();
  }

  getDbs() {
    let idConnexion = Number(localStorage.getItem("idConnection"))
    let idUser = Number(localStorage.getItem("userId"))

    this.userservice.getUserById(idUser).subscribe(data => {
      this.user=data 
      this.dbs = data.databases.filter(db => db.connexion.id == idConnexion)
      this.selectedDb = this.dbs[0]
    })
  }






  getUsers()
  {
    this.userservice.getUsers().subscribe(data => {this.users=data;console.log(this.users)});
  }
  getUserById(id:number)
  {
    this.userservice.getUserById(id).subscribe(data => {this.user=data ; console.log(this.user)})
  }
  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userservice.deleteUser(id).subscribe(() => {
        this.getUsers(); // Refresh the user list after successful deletion
      });
    }
  }

  

filteredUsers: any[] = [];

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
  this.userservice.linkDatabaseToUser(this.filteredUsers[0].identif,this.selectedDb.id).subscribe(data =>{
    console.log(data)
    if(data)
      this.users.push(this.filterUsers[0])
  })
}

  
}
