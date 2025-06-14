import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DbTable } from 'src/app/models/db-table';
import { Column } from 'src/app/models/column';

interface AvailableColumn {
  tableName: string;
  name: String;
  type?: String;
}

@Component({
  selector: 'app-lmd-delete',
  templateUrl: './lmd-delete.component.html',
  styleUrls: ['./lmd-delete.component.css']
})
export class LmdDeleteComponent implements OnChanges {
  @Input() selectedTable: DbTable | null = null;
  @Input() tableColumns: Column[] = [];
  @Input() availableTables: DbTable[] = [];
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formReset = new EventEmitter<void>();

  deleteForm: FormGroup;
  availableColumns: AvailableColumn[] = [];

  constructor(private fb: FormBuilder) {
    this.deleteForm = this.fb.group({
      table: ['', Validators.required],
      whereClauses: this.fb.array([]),
      joins: this.fb.array([])
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTable'] && this.selectedTable) {
      this.deleteForm.get('table')?.setValue(this.selectedTable.id);
      this.updateAvailableColumns();
      this.addWhereCondition();
    }
  }

  get whereClauses(): FormArray {
    return this.deleteForm.get('whereClauses') as FormArray;
  }

  get joins(): FormArray {
    return this.deleteForm.get('joins') as FormArray;
  }

  updateAvailableColumns(): void {
    this.availableColumns = [
      // Primary table columns
      ...this.tableColumns.map(col => ({
        tableName: this.selectedTable?.name || '',
        name: col.name,
        type: col.type
      })),
      // Second table columns from joins
      ...this.joins.controls.flatMap((join, index) => {
        const secondTableId = join.get('secondTableId')?.value;
        const table = this.availableTables.find(t => t.id === Number(secondTableId));
        return table ? table.columns.map(col => ({
          tableName: table.name,
          name: col.name,
          type: col.type
        })) : [];
      })
    ];
  }

  addWhereCondition(): void {
    const defaultColumn = this.tableColumns.find(col => col.name.toLowerCase().includes('id')) || this.tableColumns[0];
    const whereCondition = this.fb.group({
      column: [this.selectedTable?.name + ':' + (defaultColumn?.name || ''), Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required]
    });
    this.whereClauses.push(whereCondition);
  }

  removeWhereCondition(index: number): void {
    if (this.whereClauses.length > 1) {
      this.whereClauses.removeAt(index);
    } else {
      this.whereClauses.at(0).get('value')?.setValue('');
    }
  }

  addJoinCondition(): void {
    const joinCondition = this.fb.group({
      firstTableId: [this.selectedTable?.id || '', Validators.required],
      firstColumnName: ['', Validators.required],
      secondTableId: ['', Validators.required],
      secondColumnName: ['', Validators.required],
      joinType: ['INNER', Validators.required]
    });
    this.joins.push(joinCondition);
    this.updateAvailableColumns();
  }

  removeJoinCondition(index: number): void {
    this.joins.removeAt(index);
    this.updateAvailableColumns();
  }

  getSecondTableColumns(joinIndex: number): Column[] {
    const join = this.joins.at(joinIndex);
    const secondTableId = join.get('secondTableId')?.value;
    if (!secondTableId) return [];
    const table = this.availableTables.find(t => t.id === Number(secondTableId));
    return table ? table.columns : [];
  }

  getAvailableColumns(): AvailableColumn[] {
    return this.availableColumns;
  }

  onSubmit(): void {
    if (this.deleteForm.valid) {
      const formData = this.deleteForm.value;
      const whereClauses = formData.whereClauses.map((clause: any) => {
        const [tableName, columnName] = clause.column.split(':');
        return {
          columnName,
          operator: clause.operator,
          value: clause.value,
          tableName
        };
      });
      const joinConditions = formData.joins.map((join: any) => ({
        firstTableId: join.firstTableId,
        firstColumnName: join.firstColumnName,
        secondTableId: join.secondTableId,
        secondColumnName: join.secondColumnName,
        joinType: join.joinType
      }));
      const payload: any = {
        tableId: formData.table,
        filters: whereClauses
      };
      if (joinConditions.length > 0) {
        payload.joins = joinConditions;
      }
      this.formSubmit.emit(payload);
    }
    
  }

  resetForm(): void {
    this.whereClauses.clear();
    this.joins.clear();
    this.updateAvailableColumns();
    this.addWhereCondition();
    this.formReset.emit();
  }
}