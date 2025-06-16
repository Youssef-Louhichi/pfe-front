import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {  Router } from '@angular/router';
import { finalize, last } from 'rxjs/operators';
import { Requete } from 'src/app/models/requete';
import { User } from 'src/app/models/user';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';
import { ScriptSelectionDialogComponent } from '../script-selection-dialog/script-selection-dialog.component';
import { ScriptServiceService } from 'src/app/services/script-service.service';
import { MatDialog } from '@angular/material/dialog';

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
lastreq : Requete;
  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    private reqService : RequeteService,
    private scriptService : ScriptServiceService,
    private dialog: MatDialog
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
    const userId = Number(localStorage.getItem("userId"));
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

this.reqService.getUserReq(senderId).subscribe(data => {this.reqs = data

  this.lastreq = this.reqs[this.reqs.length-1];
  console.log(this.lastreq)


});


}


openScriptSelectionDialog(requeteId: number): void {
  const dialogRef = this.dialog.open(ScriptSelectionDialogComponent, {
    width: '400px',
    data: { requeteId }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && typeof result === 'object') {
      const { scriptIds, removedIds } = result;
  
      if (Array.isArray(scriptIds) && scriptIds.length > 0) {
        this.scriptService.addRequeteToScripts(scriptIds, requeteId).subscribe({
          next: (response) => {
            this.getReq(Number(localStorage.getItem('userId')));
            console.log('Requete added to scripts:', response);
          },
          error: (error) => {
            console.error('Error adding requete to scripts:', error);
          }
        });
      }
  
      if (Array.isArray(removedIds) && removedIds.length > 0) {
        this.scriptService.removeRequeteFromScripts(removedIds, requeteId).subscribe({
          next: (response) => {
            this.getReq(Number(localStorage.getItem('userId')));
            console.log('Requete removed from scripts:', response);
          },
          error: (error) => {
            console.error('Error removing requete from scripts:', error);
          }
        });
      }
    }
  });
}


deleteReq(id : number)
{
  this.reqService.deleteReq(id).subscribe({
    next: () => console.log('req deleted'),
  });
}

}