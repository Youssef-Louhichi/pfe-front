import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-title-popup',
  templateUrl: './title-popup.component.html',
  styleUrls: ['./title-popup.component.css']
})
export class TitlePopupComponent {

  newTitle: string = '';

  constructor(
    private dialogRef: MatDialogRef<TitlePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentTitle: string }
  ) {
    this.newTitle = data.currentTitle || ''; 
  }

  saveTitle() {
    if (this.newTitle.trim() !== '') {
      this.dialogRef.close(this.newTitle); 
    }
  }

  closeDialog() {
    this.dialogRef.close(); 
  }

}
