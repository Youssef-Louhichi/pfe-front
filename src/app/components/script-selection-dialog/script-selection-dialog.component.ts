import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { Script } from 'src/app/models/script';
import { ScriptServiceService } from 'src/app/services/script-service.service';

@Component({
  selector: 'app-script-selection-dialog',
  templateUrl: './script-selection-dialog.component.html',
  styleUrls: ['./script-selection-dialog.component.css']
})
export class ScriptSelectionDialogComponent  implements OnInit {
  scripts: Script[] = [];
  @ViewChild('scriptList') scriptList!: MatSelectionList;

  constructor(
    public dialogRef: MatDialogRef<ScriptSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { requeteId: number },
    private scriptService: ScriptServiceService
  ) {}

  ngOnInit(): void {
    this.scriptService.getAll().subscribe(scripts => {
      this.scripts = scripts;
    });
  }

  onSelect(): void {
    const selectedScriptId = this.scripts.find(script => 
      script.id === this.dialogRef.componentInstance.scriptList.selectedOptions.selected[0].value
    )?.id;
    if (selectedScriptId) {
      this.dialogRef.close(selectedScriptId);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
