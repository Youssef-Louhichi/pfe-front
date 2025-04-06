import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-user-details-popup',
  templateUrl: './user-details-popup.component.html',
  styleUrls: ['./user-details-popup.component.css']
})
export class UserDetailsPopupComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public user: User,
public dialogRef: MatDialogRef<UserDetailsPopupComponent>) { }

  close(){
    this.dialogRef.close()
  }

}
