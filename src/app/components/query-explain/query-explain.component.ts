import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface QueryExplainData {
  sql: string;
  explanation: string | null;
}

@Component({
  selector: 'app-query-explain',
  templateUrl: './query-explain.component.html',
  styleUrls: ['./query-explain.component.css']
})
export class QueryExplainComponent implements OnInit {
  loading: boolean = false;
  error: string | null = null;
  activeTab: 'sql' | 'explanation' = 'sql';

  // Event emitter for when the explain button is clicked
  @Output() explainRequest = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<QueryExplainComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QueryExplainData
  ) { }

  ngOnInit(): void {
  }

  // Request an explanation of the SQL
  requestExplanation(): void {
    this.activeTab = 'explanation';
    this.explainRequest.emit();
  }

  // Switch between SQL and explanation tabs
  switchTab(tab: 'sql' | 'explanation'): void {
    this.activeTab = tab;
  }

  // Close the dialog
  close(): void {
    this.dialogRef.close();
  }
} 