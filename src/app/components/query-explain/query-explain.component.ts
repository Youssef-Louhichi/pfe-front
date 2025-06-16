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
  @Output() explainRequest = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<QueryExplainComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QueryExplainData
  ) { }

  ngOnInit(): void {
  }
  requestExplanation(): void {
    this.activeTab = 'explanation';
    this.explainRequest.emit();
  }
  switchTab(tab: 'sql' | 'explanation'): void {
    this.activeTab = tab;
  }
  close(): void {
    this.dialogRef.close();
  }
} 