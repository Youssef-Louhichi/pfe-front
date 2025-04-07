import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Analyst } from 'src/app/models/analyst';
import { Column } from 'src/app/models/column';
import { Creator } from 'src/app/models/creator';
import { Database } from 'src/app/models/database';
import { WhereClause } from 'src/app/models/where-clause';

import { DbTable } from 'src/app/models/db-table';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';

interface JoinCondition {
  firstTableId: number;
  firstColumnName: string;
  secondTableId: number;
  secondColumnName: string;
  joinType: string;
}

@Component({
  selector: 'app-lmd',
  templateUrl: './lmd.component.html',
  styleUrls: ['./lmd.component.css']
})
export class LMDComponent implements OnInit {

  databases: Database[] = [];
  selectedDbIndex: number | null = null;
  selectedTable: DbTable | null = null;
  showColumns: { [key: string]: boolean } = {};
  showDatabases: { [key: string]: boolean } = {};
  
  // Form properties
  insertForm: FormGroup;
  updateForm: FormGroup;
  deleteForm: FormGroup; // New form for delete operations
  formMode: 'insert' | 'update' | 'delete' = 'insert'; // Added 'delete' to form modes
  tableColumns: Column[] = [];

  
  constructor(
    private userService: UsersService,
    private fb: FormBuilder,
    private reqService: RequeteService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.getDatabases();
  }

  initForms(): void {
    // Initialize insert form
    this.insertForm = this.fb.group({
      table: ['', Validators.required],
      columns: this.fb.array([])
    });

    // Initialize update form with whereClauses
    this.updateForm = this.fb.group({
      table: ['', Validators.required],
      columns: this.fb.array([]),
      whereClauses: this.fb.array([]),
      joins: this.fb.array([])
    });

    // Initialize delete form (similar to update but without columns array)
    this.deleteForm = this.fb.group({
      table: ['', Validators.required],
      whereClauses: this.fb.array([]),
      joins: this.fb.array([])
    });
  }

  get columns(): FormArray {
    return this.insertForm.get('columns') as FormArray;
  }

  get updateColumns(): FormArray {
    return this.updateForm.get('columns') as FormArray;
  }

  get whereClauses(): FormArray {
    return this.formMode === 'update' 
      ? this.updateForm.get('whereClauses') as FormArray
      : this.deleteForm.get('whereClauses') as FormArray;
  }

  get joins(): FormArray {
    return this.formMode === 'update'
      ? this.updateForm.get('joins') as FormArray
      : this.deleteForm.get('joins') as FormArray;
  }

  getDatabases(): void {
    const idConnection = Number(localStorage.getItem("idConnection"));
    const idUser = Number(localStorage.getItem("userId"));

    this.userService.getUserById(idUser).subscribe(data => {
      if (data.type == "Creator") {
        let creator = data as Creator
        this.databases = creator.connexions.find(cnx => cnx.id == idConnection).databases
      }
      else {
        let analyst = data as Analyst
        this.databases = analyst.databases.filter(db => db.connexion.id == idConnection)
      }
      if (this.databases && this.databases.length > 0) {
        this.selectedDbIndex = 0;
        this.toggleDb(this.databases[0]);
      }
    });
  }

  toggleDb(db: Database): void {
    const index = this.databases.findIndex(database => database.name === db.name);
    if (index !== -1) {
      this.selectedDbIndex = index;
    }

    // Reset all databases visibility
    for (const dbName in this.showDatabases) {
      this.showDatabases[dbName] = false;
    }

    // Show only the selected database
    this.showDatabases[db.name] = true;

    // Reset selected table when database changes
    this.selectedTable = null;
    this.tableColumns = [];
    this.clearColumnFields();
    this.clearUpdateColumnFields();
    this.clearWhereConditions();
    this.clearJoinConditions(); // Clear join conditions too
    this.insertForm.get('table').setValue('');
    this.updateForm.get('table').setValue('');
    this.deleteForm.get('table').setValue('');
  }

  toggleTable(table: DbTable): void {
    this.showColumns[table.name] = !this.showColumns[table.name];
  }

  selectTable(table: DbTable, mode: 'insert' | 'update' | 'delete'): void {
    this.selectedTable = table;
    this.tableColumns = [...table.columns];
    this.formMode = mode;
    
    if (mode === 'insert') {
      this.insertForm.get('table').setValue(table.id);
      this.generateColumnFields();
    } else if (mode === 'update') {
      this.updateForm.get('table').setValue(table.id);
      this.generateUpdateColumnFields();
      
      // Add an initial where condition
      if ((this.updateForm.get('whereClauses') as FormArray).length === 0) {
        this.addWhereCondition();
      }
    } else if (mode === 'delete') {
      this.deleteForm.get('table').setValue(table.id);
      
      // Add an initial where condition for delete form
      if ((this.deleteForm.get('whereClauses') as FormArray).length === 0) {
        this.addWhereCondition();
      }
    }
  }

  clearColumnFields(): void {
    while (this.columns.length > 0) {
      this.columns.removeAt(0);
    }
  }

  clearUpdateColumnFields(): void {
    while (this.updateColumns.length > 0) {
      this.updateColumns.removeAt(0);
    }
  }

  clearWhereConditions(): void {
    const clauses = this.formMode === 'update' 
      ? this.updateForm.get('whereClauses') as FormArray
      : this.deleteForm.get('whereClauses') as FormArray;
      
    while (clauses.length > 0) {
      clauses.removeAt(0);
    }
  }

  clearJoinConditions(): void {
    const joinArray = this.formMode === 'update'
      ? this.updateForm.get('joins') as FormArray
      : this.deleteForm.get('joins') as FormArray;
      
    while (joinArray.length > 0) {
      joinArray.removeAt(0);
    }
  }

  generateColumnFields(): void {
    // Clear existing fields
    this.clearColumnFields();

    // Create a form group for each column
    this.tableColumns.forEach(column => {
      const columnGroup = this.fb.group({
        columnName: [column.name, Validators.required],
        columnValue: ['', this.getValidatorsForColumn(column)]
      });

      this.columns.push(columnGroup);
    });
  }

  generateUpdateColumnFields(): void {
    // Clear existing fields
    this.clearUpdateColumnFields();
    
    // Create a form group for each column
    this.tableColumns.forEach(column => {
      const columnGroup = this.fb.group({
        columnName: [column.name, Validators.required],
        columnValue: [''] // Making it optional for update
      });
      
      this.updateColumns.push(columnGroup);
    });
  }

  getValidatorsForColumn(column: Column): any[] {
    const validators = [];

    // Add required validator for non-nullable columns
    validators.push(Validators.required);
    
    // Add more validators based on column type if needed
    if (column.type && (column.type.toLowerCase().includes('int') || 
        column.type.toLowerCase().includes('float') || 
        column.type.toLowerCase().includes('decimal'))) {
      validators.push(Validators.pattern(/^-?\d*\.?\d*$/));
    }

    return validators;
  }

  getPlaceholderForColumn(column: Column): String {
    return column.type || 'Value';
  }

  // Where clause methods
  addWhereCondition(): void {
    // Get a default column (first column or an ID column if available)
    const defaultColumn = this.tableColumns.find(col => 
      col.name.toLowerCase().includes('id')) || this.tableColumns[0];
    
    const whereCondition = this.fb.group({
      columnName: [defaultColumn?.name || '', Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required],
      tableName: [this.selectedTable?.name || '', Validators.required]
    });
    
    const clauses = this.formMode === 'update' 
      ? this.updateForm.get('whereClauses') as FormArray
      : this.deleteForm.get('whereClauses') as FormArray;
      
    clauses.push(whereCondition);
  }

  removeWhereCondition(index: number): void {
    const clauses = this.formMode === 'update' 
      ? this.updateForm.get('whereClauses') as FormArray
      : this.deleteForm.get('whereClauses') as FormArray;
    
    // Don't remove if it's the last condition
    if (clauses.length > 1) {
      clauses.removeAt(index);
    } else {
      // If it's the last one, just reset its values
      const lastCondition = clauses.at(0);
      lastCondition.get('value').setValue('');
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
    
    const joinArray = this.formMode === 'update'
      ? this.updateForm.get('joins') as FormArray
      : this.deleteForm.get('joins') as FormArray;
      
    joinArray.push(joinCondition);
  }

  removeJoinCondition(index: number): void {
    const joinArray = this.formMode === 'update'
      ? this.updateForm.get('joins') as FormArray
      : this.deleteForm.get('joins') as FormArray;
      
    joinArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.insertForm.valid && this.selectedTable) {
      const formData = this.insertForm.value;

      // Prepare column data
      const columnData = formData.columns.reduce((acc, item) => {
        acc[item.columnName] = item.columnValue;
        return acc;
      }, {});
      
      const requestPayload = { 
        tableId: formData.table,
        columnValues: columnData
      };
      console.log("Sending insert payload:", JSON.stringify(requestPayload, null, 2));

      // Call your service method to send the insert request
      this.reqService.insertTableData(requestPayload).subscribe(
        response => {
          console.log("Insert successful:", response);
          this.resetForm();
        },
        error => {
          console.error('Error inserting data:', error);
        }
      );
    }
  }

  onUpdateSubmit(): void {
    if (this.updateForm.valid && this.selectedTable) {
      const formData = this.updateForm.value;
      
      // Prepare column data - only include columns with values
      const columnData = formData.columns
        .filter(item => item.columnValue !== '')
        .reduce((acc, item) => {
          acc[item.columnName] = item.columnValue;
          return acc;
        }, {});
      
      // Prepare where clauses
      const whereClauses: WhereClause[] = formData.whereClauses.map(clause => ({
        columnName: clause.columnName,
        operator: clause.operator,
        value: clause.value,
        tableName: this.selectedTable.name
      }));
      
      // Check if there are columns to update
      if (Object.keys(columnData).length === 0) {
        alert("Please specify at least one column value to update");
        return;
      }
      
      // Prepare join conditions
      const joinConditions: JoinCondition[] = formData.joins.map(join => ({
        firstTableId: join.firstTableId,
        firstColumnName: join.firstColumnName,
        secondTableId: join.secondTableId,
        secondColumnName: join.secondColumnName,
        joinType: join.joinType
      }));
      
      const requestPayload: any = { 
        tableId: formData.table,
        columnValues: columnData,
        filters: whereClauses
      };
      
      // Only add joins if there are any
      if (joinConditions.length > 0) {
        requestPayload.joins = joinConditions;
      }
      
      console.log("Sending update payload:", JSON.stringify(requestPayload, null, 2));
      
      // Call service method to send the update request
      this.reqService.UpdateTableData(requestPayload).subscribe(
        response => {
          console.log("Update successful:", response);
          alert("Data updated successfully!");
          this.resetUpdateForm();
        },
        error => {
          console.error('Error updating data:', error);
          alert("Error updating data. Please check the console for details.");
        }
      );
    }
  }
  
  // New method for delete submission
  onDeleteSubmit(): void {
    if (this.deleteForm.valid && this.selectedTable) {
      const formData = this.deleteForm.value;
      
      // Prepare where clauses
      const whereClauses: WhereClause[] = formData.whereClauses.map(clause => ({
        columnName: clause.columnName,
        operator: clause.operator,
        value: clause.value,
        tableName: this.selectedTable.name
      }));
      
      // Make sure there's at least one where condition to prevent accidental deletion of all records
      if (whereClauses.length === 0) {
        alert("Please specify at least one condition for deletion");
        return;
      }
      
      // Prepare join conditions
      const joinConditions: JoinCondition[] = formData.joins.map(join => ({
        firstTableId: join.firstTableId,
        firstColumnName: join.firstColumnName,
        secondTableId: join.secondTableId,
        secondColumnName: join.secondColumnName,
        joinType: join.joinType
      }));
      
      const requestPayload: any = { 
        tableId: formData.table,
        filters: whereClauses
      };
      
      // Only add joins if there are any
      if (joinConditions.length > 0) {
        requestPayload.joins = joinConditions;
      }
      
      console.log("Sending delete payload:", JSON.stringify(requestPayload, null, 2));
      
      // Add confirmation before deleting
      if (confirm("Are you sure you want to delete these records? This action cannot be undone.")) {
        // Call service method to send the delete request
        this.reqService.DeleteTableData(requestPayload).subscribe(
          response => {
            console.log("Delete successful:", response);
            alert("Data deleted successfully!");
            this.resetDeleteForm();
          },
          error => {
            console.error('Error deleting data:', error);
            alert("Error deleting data. Please check the console for details.");
          }
        );
      }
    }
  }

  resetForm(): void {
    // Clear form values but keep the selected table
    if (this.selectedTable) {
      this.columns.controls.forEach(control => {
        control.get('columnValue').setValue('');
      });
    }
  }

  resetUpdateForm(): void {
    // Clear form values but keep the selected table
    if (this.selectedTable) {
      // Reset column values
      this.updateColumns.controls.forEach(control => {
        control.get('columnValue').setValue('');
      });
      
      // Reset where clauses to just one empty clause
      const whereClauses = this.updateForm.get('whereClauses') as FormArray;
      while (whereClauses.length > 0) {
        whereClauses.removeAt(0);
      }
      this.addWhereCondition();
      
      // Reset join conditions
      const joins = this.updateForm.get('joins') as FormArray;
      while (joins.length > 0) {
        joins.removeAt(0);
      }
    }
  }
  
  // New method for resetting delete form
  resetDeleteForm(): void {
    // Clear form values but keep the selected table
    if (this.selectedTable) {
      // Reset where clauses to just one empty clause
      const whereClauses = this.deleteForm.get('whereClauses') as FormArray;
      while (whereClauses.length > 0) {
        whereClauses.removeAt(0);
      }
      this.addWhereCondition();
      
      // Reset join conditions
      const joins = this.deleteForm.get('joins') as FormArray;
      while (joins.length > 0) {
        joins.removeAt(0);
      }
    }
  }

  getAvailableTables(): DbTable[] {
    // This should return all tables in the current database
    const currentDb = this.databases[this.selectedDbIndex];
    return currentDb ? currentDb.tables : [];
  }

  // Helper method to get columns for a specific table by ID
  getColumnsForTable(tableId: number): Column[] {
    const currentDb = this.databases[this.selectedDbIndex];  
    if (!currentDb) return [];
    
    const table = currentDb.tables.find(t => t.id === tableId);
    return table ? table.columns : [];
  }

  getSecondTableColumns(joinIndex: number): Column[] {
    const joinArray = this.formMode === 'update'
      ? this.updateForm.get('joins') as FormArray
      : this.deleteForm.get('joins') as FormArray;
    
    const join = joinArray.at(joinIndex);
    if (!join) return [];
    const secondTableId = join.get('secondTableId').value;
    if (!secondTableId) return [];
    
    // Convert to number to ensure it's the right type
    return this.getColumnsForTable(Number(secondTableId));
  }
}