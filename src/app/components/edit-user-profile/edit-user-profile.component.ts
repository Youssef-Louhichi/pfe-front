import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {  Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Requete } from 'src/app/models/requete';
import { User } from 'src/app/models/user';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-edit-user-profile',
  templateUrl: './edit-user-profile.component.html',
  styleUrls: ['./edit-user-profile.component.css']
})
export class EditUserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user: User | null = null;
  isLoading = false;
  reqs : Requete[] ;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    private reqService : RequeteService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
    this.getReq(Number(localStorage.getItem('userId')));
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  private loadUserData(): void {
    // In a real app, you might get this from a service or state management
    const userId = Number(localStorage.getItem("userId"));
    
    // This would be replaced with actual user fetching logic
this.usersService.getUserById(userId).subscribe(data =>{


  this.user = data

  if (this.user) {
    this.profileForm.patchValue({
      mail: this.user.mail,
      password: this.user.password
    });
  }
})    

   
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.user) return;

    this.isLoading = true;
    const updatedUser: User = {
      ...this.user,
      ...this.profileForm.value
    };

    this.usersService.updateUser(this.user.identif, updatedUser)
      
      .subscribe(user => {
          this.user = user;
          this.profileForm.markAsPristine();
        })
        
  }

  onCancel(): void {
    if (this.profileForm.dirty) {
      if (confirm('Are you sure you want to discard your changes?')) {
        this.router.navigate(['/profile']);
      }
    } else {
      this.router.navigate(['/profile']);
    }
  }



getReq(senderId : any)  {

this.reqService.getUserReq(senderId).subscribe(data => {this.reqs = data});


}

}