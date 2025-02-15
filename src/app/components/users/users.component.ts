import { Component } from '@angular/core';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {


   users: User[] = [
    new User(1, 'user1@example.com', 'password123', 'admin'),
    new User(2, 'user2@example.com', 'password456', 'user'),
    new User(3, 'user3@example.com', 'password789', 'moderator')
  ];



  newUser = { email: '', pass: '', role: '' };

  addUser(event: Event) {
    event.preventDefault(); // Prevents page reload

    if (!this.newUser.email || !this.newUser.pass || !this.newUser.role) return;

    const newId = this.users.length > 0 ? this.users[this.users.length - 1].id + 1 : 1;

    this.users.push({
      id: newId,
      email: this.newUser.email,
      pass: this.newUser.pass,
      role: this.newUser.role
    });

    // Reset form fields
    this.newUser = { email: '', pass: '', role: '' };
  }

  deleteUser(index: number) {
    this.users.splice(index, 1);
  }
}
