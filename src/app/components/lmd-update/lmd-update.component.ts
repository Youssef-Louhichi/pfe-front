import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DbTable } from 'src/app/models/db-table';
import { Column } from 'src/app/models/column';

interface AvailableColumn {
  tableName: String;
  name: String;
  type?: String;
}

@Component({
  selector: 'app-lmd-update',
  templateUrl: './lmd-update.component.html',
  styleUrls: ['./lmd-update.component.css']
})
export class LmdUpdateComponent implements OnChanges {
  @Input() selectedTable: DbTable | null = null;
  @Input() tableColumns: Column[] = [];
  @Input() availableTables: DbTable[] = [];
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formReset = new EventEmitter<void>();

  updateForm: FormGroup;
  availableColumns: AvailableColumn[] = [];

  constructor(private fb: FormBuilder) {
    this.updateForm = this.fb.group({
      table: ['', Validators.required],
      columns: this.fb.array([]),
      whereClauses: this.fb.array([]),
      joins: this.fb.array([])
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTable'] && this.selectedTable) {
      this.updateForm.get('table')?.setValue(this.selectedTable.id);
      this.generateColumnFields();
      this.updateAvailableColumns();
      this.addWhereCondition();
    }
  }

  get updateColumns(): FormArray {
    return this.updateForm.get('columns') as FormArray;
  }

  get whereClauses(): FormArray {
    return this.updateForm.get('whereClauses') as FormArray;
  }

  get joins(): FormArray {
    return this.updateForm.get('joins') as FormArray;
  }

  generateColumnFields(): void {
    this.updateColumns.clear();
    this.tableColumns.forEach(column => {
      const columnGroup = this.fb.group({
        columnName: [column.name, Validators.required],
        columnValue: ['']
      });
      this.updateColumns.push(columnGroup);
    });
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

  getPlaceholderForColumn(column: Column): String {
    return column.type || 'Value';
  }

  onSubmit(): void {
    if (this.updateForm.valid) {
      const formData = this.updateForm.value;
      const columnValues = formData.columns
        .filter((item: any) => item.columnValue !== '')
        .reduce((acc: any, item: any) => {
          acc[item.columnName] = item.columnValue;
          return acc;
        }, {});
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
        columnValues,
        filters: whereClauses
      };
      if (joinConditions.length > 0) {
        payload.joins = joinConditions;
      }
      else
      {
        payload.joins = null ;
      }
      this.formSubmit.emit(payload);
    }
  }

  resetForm(): void {
    this.updateColumns.controls.forEach(control => {
      control.get('columnValue')?.setValue('');
    });
    this.whereClauses.clear();
    this.joins.clear();
    this.updateAvailableColumns();
    this.addWhereCondition();
    this.formReset.emit();
  }
}