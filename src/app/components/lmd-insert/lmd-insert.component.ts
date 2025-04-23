import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DbTable } from 'src/app/models/db-table';
import { Column } from 'src/app/models/column';

@Component({
  selector: 'app-lmd-insert',
  templateUrl: './lmd-insert.component.html',
  styleUrls: ['./lmd-insert.component.css']
})
export class LmdInsertComponent implements OnChanges {
  @Input() selectedTable: DbTable | null = null;
  @Input() tableColumns: Column[] = [];
  @Output() formSubmit = new EventEmitter<{ tableId: number; columnValues: any }>();
  @Output() formReset = new EventEmitter<void>();

  insertForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.insertForm = this.fb.group({
      table: ['', Validators.required],
      columns: this.fb.array([])
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTable'] && this.selectedTable) {
      this.insertForm.get('table')?.setValue(this.selectedTable.id);
      this.generateColumnFields();
    }
  }

  get columns(): FormArray {
    return this.insertForm.get('columns') as FormArray;
  }

  generateColumnFields(): void {
    this.columns.clear();
    this.tableColumns.forEach(column => {
      const columnGroup = this.fb.group({
        columnName: [column.name, Validators.required],
        columnValue: ['', this.getValidatorsForColumn(column)]
      });
      this.columns.push(columnGroup);
    });
  }

  getValidatorsForColumn(column: Column): any[] {
    const validators = [Validators.required];
    if (column.type?.toLowerCase().includes('int') || 
        column.type?.toLowerCase().includes('float') || 
        column.type?.toLowerCase().includes('decimal')) {
      validators.push(Validators.pattern(/^-?\d*\.?\d*$/));
    }
    return validators;
  }

  getPlaceholderForColumn(column: Column): String {
    return column.type || 'Value';
  }

  onSubmit(): void {
    if (this.insertForm.valid) {
      const formData = this.insertForm.value;
      const columnValues = formData.columns.reduce((acc: any, item: any) => {
        acc[item.columnName] = item.columnValue;
        return acc;
      }, {});
      this.formSubmit.emit({ tableId: formData.table, columnValues });
    }
  }

  resetForm(): void {
    this.columns.controls.forEach(control => {
      control.get('columnValue')?.setValue('');
    });
    this.formReset.emit();
  }
}