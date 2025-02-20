import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit{


  users: User[] = [];

  constructor(private userservice : UsersService){}
  ngOnInit(): void {
    
    this.getUsers();
  }
  getUsers()
  {
    this.userservice.getUsers().subscribe(data => {this.users=data;console.log(this.users)});
  }


}
