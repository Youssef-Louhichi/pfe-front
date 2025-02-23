import { Component, OnInit } from '@angular/core';
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
  useradd: User = { mail: '', password: '' };
  constructor(private userservice : UsersService){}
  ngOnInit(): void {
    
    this.getUsers();
  }

  onSubmit() {
    if (this.useradd.mail && this.useradd.password) {
      this.userservice.createUser(this.useradd).subscribe(() => {
        alert('User added successfully!');
        this.getUsers();
        this.useradd = {mail: '', password: '' }; // Reset form
      });
    } else {
      alert('Please fill in all fields.');
    }
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
}
