import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-task-popup',
  templateUrl: './task-popup.component.html',
  styleUrls: ['./task-popup.component.css']
})
export class TaskPopupComponent {

  description = '';

  constructor(
    public dialogRef: MatDialogRef<TaskPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receiverId: number }
  ) {}

  sendTask() {
    if (this.description.trim()) {
      this.dialogRef.close({ description: this.description });
    }
  }

  cancel() {
    this.dialogRef.close();
  }

}
