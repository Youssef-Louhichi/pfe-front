import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScriptServiceService } from 'src/app/services/script-service.service';
@Component({
  selector: 'app-scriptdetails',
  templateUrl: './scriptdetails.component.html',
  styleUrls: ['./scriptdetails.component.css']
})
export class ScriptdetailsComponent implements OnInit {


  script: any;
  removedRequetes: number[] = [];



  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { scriptId: number },
    private dialogRef: MatDialogRef<ScriptdetailsComponent>,
    private scriptservice: ScriptServiceService
  ) {}


  ngOnInit(): void {
    this.scriptservice.getReqScriptById(this.data.scriptId).subscribe((res: any) => {
      this.script = res;
    });
  }

  isRemoved(reqId: number): boolean {
    return this.removedRequetes.includes(reqId);
  }

  removeRequete(reqId: number): void {
    if (!this.isRemoved(reqId)) {
      this.removedRequetes.push(reqId);
    }
  }

  confirm(): void {
    this.dialogRef.close(this.removedRequetes);
    console.log(this.removedRequetes) // pass removed IDs back
  }

  cancel(): void {
    this.dialogRef.close(); // close without saving
  }

}
