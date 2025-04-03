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
    public dialogRef: MatDialogRef<TitlePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentTitle: string }
  ) {
    this.newTitle = data.currentTitle || ''; // Initialize with existing title
  }

  saveTitle() {
    if (this.newTitle.trim() !== '') {
      this.dialogRef.close(this.newTitle); // Pass back the title
    }
  }

  closeDialog() {
    this.dialogRef.close(); // Just close without saving
  }

}
