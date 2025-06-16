import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef  } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { Script } from 'src/app/models/script';
import { RequeteService } from 'src/app/services/requete.service';
import { ScriptServiceService } from 'src/app/services/script-service.service';

@Component({
  selector: 'app-script-selection-dialog',
  templateUrl: './script-selection-dialog.component.html',
  styleUrls: ['./script-selection-dialog.component.css']
})
export class ScriptSelectionDialogComponent implements OnInit {
  scripts: Script[] = [];
  selectedScripts: number[] = [];
  originalSelectedScripts: number[] = [];
  recentlyAddedScripts: Set<number> = new Set();
  secondtable : number[] = [];
  
  
  constructor(
    public dialogRef: MatDialogRef<ScriptSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { requeteId: number },
    private scriptService: ScriptServiceService,
    private requeteService: RequeteService
  ) {}
  
  ngOnInit(): void {
    const userId = Number(localStorage.getItem("userId"));
    this.scriptService.getByUser(userId).subscribe(scripts => {
      this.scripts = scripts;
      this.requeteService.getReqById(this.data.requeteId).subscribe(requete => {
        this.selectedScripts = requete.scripts?.map(script => script.id) || [];
        this.originalSelectedScripts = [...this.selectedScripts];
      });
    });
  }
  
  isScriptSelected(scriptId: number): boolean {
    return this.selectedScripts.includes(scriptId);
  }
  
  isRecentlyAdded(scriptId: number): boolean {
    return this.recentlyAddedScripts.has(scriptId);
  }
  
  toggleAdd(scriptId: number): void {
    if (!this.selectedScripts.includes(scriptId)) {
      this.selectedScripts.push(scriptId);
    }
  }
  
  toggleRemove(scriptId: number): void {
    if (!this.secondtable.includes(scriptId)) {
      this.secondtable.push(scriptId);
    }
  }
  
  
  onConfirm(): void {
    this.dialogRef.close({
      scriptIds: this.selectedScripts,
      removedIds: this.secondtable
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}