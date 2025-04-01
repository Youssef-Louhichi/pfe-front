import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Analyst } from 'src/app/models/analyst';
import { Column } from 'src/app/models/column';
import { Creator } from 'src/app/models/creator';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';

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
  insertForm: FormGroup;
  tableColumns: Column[] = [];



  constructor(
    private userService: UsersService,
    private fb: FormBuilder,
    private reqService: RequeteService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getDatabases();
  }

  initForm(): void {
    this.insertForm = this.fb.group({
      table: ['', Validators.required],
      columns: this.fb.array([])
    });
  }

  get columns(): FormArray {
    return this.insertForm.get('columns') as FormArray;
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
    this.insertForm.get('table').setValue('');
  }

  toggleTable(table: DbTable): void {
    this.showColumns[table.name] = !this.showColumns[table.name];
  }

  selectTable(table: DbTable): void {
    this.selectedTable = table;
    this.tableColumns = [...table.columns];
    this.insertForm.get('table').setValue(table.id); // Store the table ID, not the name

    // Generate form fields for all columns
    this.generateColumnFields();
  }



  clearColumnFields(): void {
    while (this.columns.length > 0) {
      this.columns.removeAt(0);
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

  getValidatorsForColumn(column: Column): any[] {
    const validators = [];

    // Add required validator for non-nullable columns

    validators.push(Validators.required);


    // Add more validators based on column type if needed
    // For example, numeric validators for number fields
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

  onSubmit(): void {
    if (this.insertForm.valid && this.selectedTable) {
      const formData = this.insertForm.value;

      // Prepare column data
      const columnData = formData.columns.reduce((acc, item) => {
        acc[item.columnName] = item.columnValue;
        return acc;
      }, {});

      const requestPayload = {
        tableId: formData.table, // This is already the table ID
        columnValues: columnData
      };
      console.log("Sending insert payload:", JSON.stringify(requestPayload, null, 2));

      // Call your service method to send the insert request
      this.reqService.insertTableData(requestPayload).subscribe(
        response => {
          console.log("Insert successful:", response);
          // Handle success - maybe reset form or show success message
          this.resetForm();
        },
        error => {
          console.error('Error inserting data:', error);
          // Handle error
        }
      );
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
}