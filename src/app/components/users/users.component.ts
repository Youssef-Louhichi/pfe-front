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
    this.userservice.getUserById(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.user=data 
      this.dbs = data.databases
      this.selectedDb = this.dbs[0]
    })
  }


  onSubmit() {/*
    if (this.useradd.mail && this.useradd.password) {
      this.userservice.createUser(this.useradd).subscribe(() => {
        alert('User added successfully!');
        this.getUsers();
        this.useradd = {mail: '', password: '' }; // Reset form
      });
    } else {
      alert('Please fill in all fields.');
    }*/
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
  })
}

  
}
