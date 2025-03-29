import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {  Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Column } from 'src/app/models/column';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { Graph } from 'src/app/models/graph';
//import { WhereClause } from 'src/app/models/where-clause';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';

interface WhereClause {
  columnName: string;
  operator: string;
  value: string;
  tableName : string
}

interface JoinCondition {
  firstTableId: number;
  firstColumnName: string;
  secondTableId: number;
  secondColumnName: string;
  joinType: string;
}

interface ColumnWithTable extends Column {
  table: DbTable;
}

@Component({
  selector: 'app-query-builder',
  templateUrl: './query-builder.component.html',
  styleUrls: ['./query-builder.component.css']
})
export class QueryBuilderComponent implements OnInit {

  constructor(private userservice: UsersService, private fb: FormBuilder, private reqservice: RequeteService
  ) { }



  databases: Database[];
    queryForm: FormGroup;
    showColumns: { [key: string]: boolean } = {};
    showDatabases: { [key: string]: boolean } = {};
    http: any;
    table: DbTable = null;
    tableData: any[] = [];
    tableHeaders: string[] = [];
    columns2: Column[] = [];
    allColumns: Column[] = [];
    selectedDbIndex: number | null = null;
    selectedTables: DbTable[] = [];
    selectedColumns: ColumnWithTable[] = [];
    whereConditionColumns: ColumnWithTable[] = [];
    // Track which columns have been selected
    selectedColumnIds: Set<number> = new Set();
  
    originalTableColumns: { [tableId: number]: Column[] } = {};
  
    ngOnInit(): void {
      this.queryForm = this.fb.group({
        table: ['', Validators.required],
        column: ['', Validators.required],
        whereClauses: this.fb.array([]),
        joinClauses: this.fb.array([]) 
      });
  
      this.getDbs();
      
      if (this.databases && this.databases.length > 0) {
        this.selectedDbIndex = 0;
        this.toggleDb(this.databases[0]);
      }


      this.queryForm.get('table').valueChanges.subscribe(() => {
        if (this.selectedTables.length > 1 && this.joinClauses.length === 0) {
          this.addJoinCondition();
        }
      });
    }

    get joinClauses(): FormArray {
      return this.queryForm.get('joinClauses') as FormArray;
    }

    addJoinCondition() {
      if (this.selectedTables.length < 2) {
        return;
      }
  
      const firstTable = this.selectedTables[0];
      const secondTable = this.selectedTables.length > 1 ? this.selectedTables[1] : this.selectedTables[0];
      
      const firstColumn = firstTable.columns.find(c => c.name.toLowerCase().includes('id')) || firstTable.columns[0];
      const secondColumn = secondTable.columns.find(c => c.name.toLowerCase().includes('id')) || secondTable.columns[0];
  
      const joinCondition = this.fb.group({
        firstTableId: [firstTable.id, Validators.required],
        firstColumnName: [firstColumn.name, Validators.required],
        secondTableId: [secondTable.id, Validators.required],
        secondColumnName: [secondColumn.name, Validators.required],
        joinType: ['INNER', Validators.required]
      });
  
      this.joinClauses.push(joinCondition);
    }
  
    removeJoinCondition(index: number) {
      this.joinClauses.removeAt(index);
    }

    getTableColumns(tableId: number): Column[] {
      if (!tableId) return [];
      
      const table = this.selectedTables.find(t => t.id === +tableId);
      return table ? table.columns : [];
    }



    onFirstTableChange(index: number) {
      const joinControl = this.joinClauses.at(index);
      const tableId = joinControl.get('firstTableId').value;
      const columns = this.getTableColumns(tableId);
      
      if (columns.length > 0) {
        const idColumn = columns.find(c => c.name.toLowerCase().includes('id')) || columns[0];
        joinControl.get('firstColumnName').setValue(idColumn.name);
      }
    }
  
    onSecondTableChange(index: number) {
      const joinControl = this.joinClauses.at(index);
      const tableId = joinControl.get('secondTableId').value;
      const columns = this.getTableColumns(tableId);
      
      if (columns.length > 0) {
        const idColumn = columns.find(c => c.name.toLowerCase().includes('id')) || columns[0];
        joinControl.get('secondColumnName').setValue(idColumn.name);
      }
    }
  
    onColumnDropForCondition(event: CdkDragDrop<Column[]>) {
      // Check if column already exists in conditions
      const draggedColumn = event.previousContainer.data[event.previousIndex];
      
      const columnExists = this.whereClauses.controls.some(
        control => control.get('columnName').value === draggedColumn.name
      );
      
      if (!columnExists) {
        // Create a new where clause form group
        console.log("taw");
        const whereCondition = this.fb.group({
          columnName: [draggedColumn.name , Validators.required],
          tableName: [draggedColumn.table.name, Validators.required],
          operator: ['=', Validators.required],
          value: ['', Validators.required]
        });
        
        // Add the condition to the form array
        this.whereClauses.push(whereCondition);
        
        // Ensure the table is added to selected tables
        this.addTableToSelectedTables(draggedColumn.table);
      }
    }
   
    drop(event: CdkDragDrop<ColumnWithTable[]>, type: 'columns' | 'conditions') {
      const targetArray = type === 'columns' ? this.selectedColumns : this.whereConditionColumns;
      
      if (event.previousContainer === event.container) {
        // Reorder within the same list
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        const draggedColumn = event.previousContainer.data[event.previousIndex];
        
        // Check if column already exists in target array
        const columnExists = targetArray.some(c => c.id === draggedColumn.id);
        
        if (!columnExists) {
          // Enrich column with table information
          const columnWithTable: ColumnWithTable = {
            ...draggedColumn,
            table: this.getTableForColumn(draggedColumn)
          };
          
          // Copy the item instead of transferring to keep it in original list
          copyArrayItem(
            event.previousContainer.data,
            targetArray,
            event.previousIndex,
            event.currentIndex
          );
          
          // Add table to selected tables if not already present
          this.addTableToSelectedTables(columnWithTable.table);
          
          // Update form
          this.updateFormColumns();
        }
      }
    }

    private getTableForColumn(column: Column): DbTable {
      for (const db of this.databases) {
        for (const table of db.tables) {
          if (table.columns.some(c => c.id === column.id)) {
            return table;
          }
        }
      }
      throw new Error('Table not found for column');
    }

    private generateJoinConditions() {
      const joinConditions = this.joinClauses.value;
      return joinConditions.length > 0 ? joinConditions : [];
    }
    private addTableToSelectedTables(table: DbTable) {
      if (!this.selectedTables.some(t => t.id === table.id)) {
        this.selectedTables.push(table);
        
        // Auto-add join condition if we now have more than one table
        if (this.selectedTables.length === 2) {
          this.addJoinCondition();
        }
      }
    }


    removeTable(table: DbTable) {
      // Remove table from selectedTables
      this.selectedTables = this.selectedTables.filter(t => t.id !== table.id);
      
      // Remove columns from this table
      this.selectedColumns = this.selectedColumns.filter(c => c.table.id !== table.id);
      this.whereConditionColumns = this.whereConditionColumns.filter(c => c.table.id !== table.id);
      
      // Update form
      this.updateFormColumns();
    }

    removeColumn(column: ColumnWithTable, type: 'columns' | 'conditions') {
      const targetArray = type === 'columns' ? this.selectedColumns : this.whereConditionColumns;
      
      // Remove column from target array
      const index = targetArray.findIndex(c => c.id === column.id);
      if (index !== -1) {
        targetArray.splice(index, 1);
      }
      
      // Check if table should be removed
      const tableColumns = [
        ...this.selectedColumns.filter(c => c.table.id === column.table.id),
        ...this.whereConditionColumns.filter(c => c.table.id === column.table.id)
      ];
      
      // If no columns for this table remain, remove the table
      if (tableColumns.length === 0) {
        this.selectedTables = this.selectedTables.filter(t => t.id !== column.table.id);
      }
      
      // Update form
      this.updateFormColumns();
    }

  // Check if a column is selected in a specific list
  isColumnSelected(columnId: number, type: 'columns' | 'conditions'): boolean {
    const targetArray = type === 'columns' ? this.selectedColumns : this.whereConditionColumns;
    return targetArray.filter(c => c.id === columnId).length > 1;
  }

  // Update form columns
  updateFormColumns() {
    // Combine column IDs from both lists
    const columnIds = [
      ...this.selectedColumns.map(c => c.id),
      ...this.whereConditionColumns.map(c => c.id)
    ];
    
    this.queryForm.patchValue({ 
      column: columnIds,
      table: this.selectedTables.map(t => t.name).join(', ')
    });
  }
  getDbs() {
    let idConnexion = Number(localStorage.getItem("idConnection"));
    let idUser = Number(localStorage.getItem("userId"));
    
    this.userservice.getUserById(idUser).subscribe(data => {
      this.databases = data.databases.filter(db => db.connexion.id == idConnexion);
      
      // Store original columns for each table
      this.databases.forEach(db => {
        db.tables.forEach(table => {
          this.originalTableColumns[table.id] = [...table.columns];
        });
      });
    });
  }
  
  
    toggleDb(db: Database) {
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
    }
  
    toggleTable(table: DbTable): void {
      this.showColumns[table.name] = !this.showColumns[table.name];
    }
  
    useTable(t: DbTable) {
      this.table = t;
      this.queryForm.get("table").setValue(t.name);
      this.columns2 = t.columns;
      this.allColumns = [...t.columns];
    }
  
    onSubmit() {
      if (this.queryForm.valid) {
        const formData = this.queryForm.value;
        
        // Prepare where conditions
        const whereConditions: WhereClause[] = formData.whereClauses.map((condition: any) => ({
          columnName: condition.columnName,
        tableName: condition.tableName,
        operator: condition.operator,
        value: condition.value
        }));
  
        // Construct request payload
        const requestPayload = {
          req: {
            id: 1,
            sentAt: new Date().toISOString(),
            sender: {
              identif: 1,
              mail: "test@example.com",
              password: "1234"
            },
            content: "Fetching data"
          },
          tableId: this.selectedTables.map(t => t.id),
          columnId: formData.column,
          groupByColumns: [],
          aggregations: [],
          joinRequest: {
            joinConditions: this.generateJoinConditions()
          },
          filters: whereConditions
        };
  
        console.log("Sending request payload:", JSON.stringify(requestPayload, null, 2));
  
        this.reqservice.fetchTableData(requestPayload).subscribe(
          response => {
            this.tableData = response;
            if (this.tableData.length > 0) {
              this.tableHeaders = Object.keys(this.tableData[0]);
            }
          },
          error => console.error('Error fetching data:', error)
        );
      }
    }

  
    // Existing methods for where clauses
    get whereClauses(): FormArray {
      return this.queryForm.get('whereClauses') as FormArray;
    }
  
    addWhereCondition() {
      const whereCondition = this.fb.group({
        columnName: ['', Validators.required],
        operator: ['=', Validators.required],
        value: ['', Validators.required]
      });
      this.whereClauses.push(whereCondition);
    }
  
    removeWhereCondition(index: number) {
      this.whereClauses.removeAt(index);
    }

    @Output() newItemEvent = new EventEmitter<Graph>();
    
    addTableToWorkspace(){
      if (this.tableData.length) {

        this.newItemEvent.emit(
          new Graph(
          Date.now(),
           [...this.tableHeaders],
          [...this.tableData],
         "table",
           300,
           200,
           100,
           100,
           null,
           null,
           null, 
           null,
           null
      ));
      }
    }
  
   

}
