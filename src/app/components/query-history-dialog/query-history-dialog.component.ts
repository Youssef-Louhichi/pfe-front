import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Requete } from 'src/app/models/requete';
import { RequeteService } from 'src/app/services/requete.service';
import { ScriptServiceService } from 'src/app/services/script-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ScriptSelectionDialogComponent } from '../script-selection-dialog/script-selection-dialog.component';

@Component({
  selector: 'app-query-history-dialog',
  templateUrl: './query-history-dialog.component.html',
  styleUrls: ['./query-history-dialog.component.css']
})
export class QueryHistoryDialogComponent implements OnInit {
  reqs: Requete[] = [];

  constructor(
    private dialogRef: MatDialogRef<QueryHistoryDialogComponent>,
    private reqService: RequeteService,
    private scriptService: ScriptServiceService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getReq(Number(localStorage.getItem('userId')));
  }

  getReq(senderId: any) {
    this.reqService.getUserReq(senderId).subscribe(data => {
      this.reqs = data;
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

  deleteReq(id: number) {
    this.reqService.deleteReq(id).subscribe({
      next: () => {
        console.log('req deleted');
        this.getReq(Number(localStorage.getItem('userId')));
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
} 