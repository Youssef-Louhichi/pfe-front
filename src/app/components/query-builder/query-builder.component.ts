import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map, Observable, of } from 'rxjs';
import { Analyst } from 'src/app/models/analyst';
import { Column } from 'src/app/models/column';
import { Creator } from 'src/app/models/creator';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { Graph } from 'src/app/models/graph';
import { Requete } from 'src/app/models/requete';
import { Script } from 'src/app/models/script';
import { AnalystService } from 'src/app/services/analyst.service';
import { ConnexionsService } from 'src/app/services/connexions.service';
//import { WhereClause } from 'src/app/models/where-clause';
import { RequeteService } from 'src/app/services/requete.service';
import { ScriptServiceService } from 'src/app/services/script-service.service';
import { SuggestionsService } from 'src/app/services/suggestions.service';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
import { trigger, transition, style, animate } from '@angular/animations';
const apiKey = environment.openRouterApiKey;

interface HavingCondition {
  functionhaving: string;
  columnId: number;
  operator: string;
  value: string;
  subqueryComparator?: string;
  test: boolean;
}


interface WhereClause {
  columnName: string;
  operator: string;
  value: string;
  tableName: string;
  test: boolean; // To determine if the value is a subquery or not
  subqueryComparator?: string; // Optional field for subquery comparison (IN, NOT IN)
}
interface AggregationWithColumn {
  columnId: number;
  columnName: string;
  tableId: number;
  functionagg: string;
}
interface Aggregation {
  columnId: number;
  functionagg: string[]; // List of functions
}
interface JoinCondition {
  firstTableId: number;
  firstColumnName: string;
  secondTableId: number;
  secondColumnName: string;
  joinType: string;
}
interface orderBy
{
  colId: number;
  orderType : string;
}

interface ColumnWithTable extends Column {
  table: DbTable;
}

@Component({
  selector: 'app-query-builder',
  templateUrl: './query-builder.component.html',
  styleUrls: ['./query-builder.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class QueryBuilderComponent implements OnInit {

  constructor(private userservice: UsersService, private fb: FormBuilder, private reqservice: RequeteService,
    private analystservice:AnalystService,private connexionservice:ConnexionsService,private scriptService: ScriptServiceService,private route: ActivatedRoute
    ,private suggestionsservice:SuggestionsService
  ) { }

  @Output() newItemEvent = new EventEmitter<Graph>();
  @Output() hideQueryBuilder = new EventEmitter<void>();

  scripts: Script[];
  allResults: { headers: string[], rows: any[] }[] = [];
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
  selectedColumnIds: Set<number> = new Set();
  resultSource: 'script' | 'query' | null = null;
  havingConditionColumns: ColumnWithTable[] = [];
  availableHavingFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
  groupByColumns: ColumnWithTable[] = [];
  availableAggFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

  originalTableColumns: { [tableId: number]: Column[] } = {};

  toggle:boolean = true
  ai_input:string = ""
  sug_queries:String[]


  savedRequests: Requete[] = [];
  subqueryPayload: any = null;

  reqs : Requete[] ;
  lastreq : Requete;
  showSqlButton: boolean = false;
  isDbMode: boolean = true;
  selectedScriptIndex: number = 0;
  showNotification = false;

  ngOnInit(): void {
    this.queryForm = this.fb.group({
      table: ['', Validators.required],
      column: [''],
      whereClauses: this.fb.array([]),
      joinClauses: this.fb.array([]),
      aggregations: this.fb.array([]),
      groupByColumns: this.fb.array([]),
      havingClauses: this.fb.array([]),
      orderBy : this.fb.array([]),
      limit: ['']
    });
  
    this.getDbs();
    this.getScripts();
  this.loadSavedRequests();

    if (this.databases && this.databases.length > 0) {
      this.selectedDbIndex = 0;
      this.toggleDb(this.databases[0]);
    }
  
    this.queryForm.get('table').valueChanges.subscribe(() => {
      if (this.selectedTables.length > 1 && this.joinClauses.length === 0) {
        this.addJoinCondition();
      }
    });


    const scriptId = this.route.snapshot.paramMap.get('scriptId');
    if (scriptId) {
      this.fetchResults(Number(scriptId));
    }
  }


  get havingClauses(): FormArray {
  return this.queryForm.get('havingClauses') as FormArray;
}



// Method to handle column drop for HAVING condition
onColumnDropForHaving(event: CdkDragDrop<Column[]>) {
  const draggedColumn = event.previousContainer.data[event.previousIndex];
  
  // Check if column is already used in having condition
  const columnExists = this.havingClauses.controls.some(
    control => control.get('columnId').value === draggedColumn.id
  );
  
  if (!columnExists) {
    const table = this.getTableForColumn(draggedColumn);
    
    // Create a new having condition with subquery support
    const havingCondition = this.fb.group({
      functionhaving: ['COUNT', Validators.required],
      columnId: [draggedColumn.id, Validators.required],
      columnName: [draggedColumn.name, Validators.required],
      tableName: [table.name, Validators.required],
      operator: ['>', Validators.required],
      value: ['0', Validators.required],
      subqueryComparator: ['in'],
      test: [false]  // Default to simple condition, not subquery
    });
    
    this.havingClauses.push(havingCondition);
    this.addTableToSelectedTables(table);
  }
}

getRequestById(reqId: number): Observable<any> {
  return this.reqservice.getReqById(reqId).pipe(
    map(req => {
      // Return the request data that will be used as a subquery
      return req;
    })
  );
}


// Method to remove a having condition
removeHavingCondition(index: number) {
  if (index >= 0 && index < this.havingClauses.length) {
    this.havingClauses.removeAt(index);
  }
}
loadSavedRequests(): void {
  const userId = Number(localStorage.getItem('userId'));
  if (userId) {
    this.reqservice.getUserReq(userId).subscribe({
      next: (requests) => {
        this.savedRequests = requests;
      },
      error: (error) => {
        console.error('Error loading saved requests:', error);
      }
    });
  }
}

// Handle subquery toggle
onSubqueryToggle(index: number): void {
  const havingControl = this.havingClauses.at(index);
  const isSubquery = havingControl.get('test').value;
  
  if (isSubquery) {
    // Reset value when switching to subquery mode
    havingControl.get('value').setValue('');
    
    // Make sure we've loaded the saved requests
    if (this.savedRequests.length === 0) {
      this.loadSavedRequests();
    }
  }
}

processHavingConditions(conditions: any[]): Observable<any[]> {
  if (!conditions || conditions.length === 0) {
    return of([]);
  }
  
  const havingConditionsProcessing: Observable<any>[] = conditions.map(condition => {
  if (condition.test) { // This is a subquery
    return this.getRequestById(condition.value).pipe(
      map(subqueryReq => {
        // Map only the specific fields we need
        const mappedSubquery = {
          sentAt: subqueryReq.sentAt,
          sender: {
            identif: subqueryReq.sender?.identif,
            mail: subqueryReq.sender?.mail,
            password: subqueryReq.sender?.password
          },
          content: subqueryReq.content,
          tableId: subqueryReq.tableId,
          columnId: subqueryReq.columnId,
          aggregation: subqueryReq.aggregation || [],
          groupByColumns: subqueryReq.groupByColumns || [],
          joinConditions: subqueryReq.joinConditions || [],
          filters: subqueryReq.filters || [],
          havingConditions: subqueryReq.havingConditions || []
        };
        
        return {
          function: condition.functionhaving,
          columnId: condition.columnId,
          operator: condition.operator,
          test: true,
          subqueryComparator: condition.subqueryComparator,
          value: mappedSubquery // Only the needed fields
        };
      })
    );
  } else {
    // For non-subquery conditions, create a resolved observable
    return of({
      function: condition.functionhaving,
      columnId: condition.columnId,
      operator: condition.operator,
      value: condition.value,
      test: false
    });
  }
});
  
  return forkJoin(havingConditionsProcessing);
}
  toggleSelectionMode(): void {
    this.isDbMode = !this.isDbMode;
  }

  selectAllTableColumns(table: DbTable, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation(); // Prevent toggleTable from being called
    }
    
    // Create a column with table object for each column in the table
    const columnsWithTable: ColumnWithTable[] = table.columns.map(column => {
      return {
        ...column,
        table: table
      };
    });
    
    // For each column, check if it already exists in selectedColumns
    columnsWithTable.forEach(columnWithTable => {
      // Only add if not already present
      if (!this.selectedColumns.some(c => c.id === columnWithTable.id)) {
        this.selectedColumns.push(columnWithTable);
        
        // Add table to selected tables if not already present
        this.addTableToSelectedTables(table);
      }
    });
    
    // Update form
    this.updateFormColumns();
  }
  
  /**
   * Checks if all columns of a table are already selected
   */
  isTableFullySelected(table: DbTable): boolean {
    // If there are no columns in the table, return false
    if (table.columns.length === 0) {
      return false;
    }
    
    // Check if all columns from this table are in the selectedColumns array
    return table.columns.every(column => 
      this.selectedColumns.some(selectedColumn => 
        selectedColumn.id === column.id
      )
    );
  }

// Form control getters
get aggregationControls(): FormArray {
  return this.queryForm.get('aggregations') as FormArray;
}

get groupByControls(): FormArray {
  return this.queryForm.get('groupByColumns') as FormArray;
}

// Method to add an aggregation
addAggregation() {
  const aggregation = this.fb.group({
    columnId: ['', Validators.required],
    columnName: ['', Validators.required],
    tableId: ['', Validators.required],
    functionagg: this.fb.array([this.fb.control('COUNT')]) // Default to COUNT function
  });
  this.aggregationControls.push(aggregation);
}

// Method to handle change in aggregation function via dropdown
onAggregationFunctionChange(aggregationIndex: number, event: any) {
  const selectedFunction = event.target.value;
  const aggregation = this.aggregationControls.at(aggregationIndex);
  const functionsArray = aggregation.get('functionagg') as FormArray;
  
  // Clear the array and add the new function
  functionsArray.clear();
  functionsArray.push(this.fb.control(selectedFunction));
}

// Method to add an aggregation function (for future multi-function support)
addAggregationFunction(index: number, functionType: string = 'COUNT') {
  const aggregation = this.aggregationControls.at(index);
  const functionsArray = aggregation.get('functionagg') as FormArray;
  
  // If UI only supports one function at a time, clear existing functions first
  if (functionsArray.length > 0) {
    functionsArray.clear();
  }
  
  functionsArray.push(this.fb.control(functionType));
}
/*
// Method to remove an aggregation function (for future multi-function support)
removeAggregationFunction(aggregationIndex: number, functionIndex: number) {
  const aggregation = this.aggregationControls.at(aggregationIndex);
  const functionsArray = aggregation.get('functionagg') as FormArray;
  
  if (functionIndex >= 0 && functionIndex < functionsArray.length) {
    functionsArray.removeAt(functionIndex);
  }
}
*/
// Method to remove an aggregation
removeAggregation(index: number) {
  if (index >= 0 && index < this.aggregationControls.length) {
    this.aggregationControls.removeAt(index);
    // Update group by columns after removing aggregation
    this.updateGroupByColumnsAfterAggregation();
  }
}

// Method to handle column drop for aggregation
onColumnDropForAggregation(event: CdkDragDrop<Column[]>) {
  const draggedColumn = event.previousContainer.data[event.previousIndex];
  
  const columnExists = this.aggregationControls.controls.some(
    control => control.get('columnId').value === draggedColumn.id
  );
  
  if (!columnExists) {
    const table = this.getTableForColumn(draggedColumn);
    
    const aggregation = this.fb.group({
      columnId: [draggedColumn.id, Validators.required],
      columnName: [draggedColumn.name, Validators.required],
      tableId: [table.id, Validators.required],
      functionagg: this.fb.array([this.fb.control('COUNT')]) // Default to COUNT function
    });
    
    this.aggregationControls.push(aggregation);
    this.addTableToSelectedTables(table);
    this.updateGroupByColumnsAfterAggregation();
  }
}



  updateGroupByColumnsAfterAggregation() {
    // Get all aggregated column IDs
    const aggregatedColumnIds = this.aggregationControls.controls.map(
      control => Number(control.get('columnId').value)
    );
   console.log("soiiososososos");
    // Add all selected columns that are not aggregated to group by
    this.selectedColumns.forEach(column => {
      if (!aggregatedColumnIds.includes(column.id) && 
          !this.groupByColumns.some(gc => gc.id === column.id)) {
        this.groupByColumns.push(column);
      }
    });
  }

  onColumnDropForGroupBy(event: CdkDragDrop<Column[]>) {
    const draggedColumn = event.previousContainer.data[event.previousIndex];
    
    // Check if column already exists in group by
    const columnExists = this.groupByColumns.some(c => c.id === draggedColumn.id);
    
    if (!columnExists) {
      // Enrich column with table information
      const columnWithTable: ColumnWithTable = {
        ...draggedColumn,
        table: this.getTableForColumn(draggedColumn)
      };
      
      // Add to group by columns
      this.groupByColumns.push(columnWithTable);
      
      // Ensure the table is added to selected tables
      this.addTableToSelectedTables(columnWithTable.table);
      
      // Add column to selectedColumns if not already there
      if (!this.selectedColumns.some(c => c.id === columnWithTable.id)) {
        this.selectedColumns.push(columnWithTable);
        this.updateFormColumns();
      }
    }
  }
  
  // Method to remove a group by column
  removeGroupByColumn(index: number) {
    if (index >= 0 && index < this.groupByColumns.length) {
      this.groupByColumns.splice(index, 1);
    }
  }


  getAvailableColumns(): ColumnWithTable[] {
    // Return all columns from all selected tables
    const allColumns: ColumnWithTable[] = [];
    
    this.selectedTables.forEach(table => {
      table.columns.forEach(column => {
        allColumns.push({
          ...column,
          table: table
        });
      });
    });
    
    return allColumns;
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
  const draggedColumn = event.previousContainer.data[event.previousIndex];

  const columnExists = this.whereClauses.controls.some(
    control => control.get('columnName').value === draggedColumn.name
  );

  if (!columnExists) {
    const table = this.getTableForColumn(draggedColumn);
    
    const whereCondition = this.fb.group({
      columnName: [draggedColumn.name, Validators.required],
      tableName: [table.name, Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required],
      test: [false],  // Default to simple condition (not a subquery)
      subqueryComparator: ['in'] // Default subquery comparator
    });

    this.whereClauses.push(whereCondition);
    this.addTableToSelectedTables(table);
  }
}

onWhereSubqueryToggle(index: number): void {
  const whereControl = this.whereClauses.at(index);
  const isSubquery = whereControl.get('test').value;
  
  if (isSubquery) {
    // Reset value when switching to subquery mode
    whereControl.get('value').setValue('');
    
    // Make sure we've loaded the saved requests
    if (this.savedRequests.length === 0) {
      this.loadSavedRequests();
    }
  }
}


processWhereConditions(conditions: any[]): Observable<any[]> {
  if (!conditions || conditions.length === 0) {
    return of([]);
  }
  
  const whereConditionsProcessing: Observable<any>[] = conditions.map(condition => {
    if (condition.test) { // This is a subquery
      return this.getRequestById(condition.value).pipe(
        map(subqueryReq => {
          // Map only the specific fields we need
          const mappedSubquery = {
            sentAt: subqueryReq.sentAt,
            sender: {
              identif: subqueryReq.sender?.identif,
              mail: subqueryReq.sender?.mail,
              password: subqueryReq.sender?.password
            },
            content: subqueryReq.content,
            tableId: subqueryReq.tableId,
            columnId: subqueryReq.columnId,
            aggregation: subqueryReq.aggregation || [],
            groupByColumns: subqueryReq.groupByColumns || [],
            joinConditions: subqueryReq.joinConditions || [],
            filters: subqueryReq.filters || [],
            havingConditions: subqueryReq.havingConditions || []
          };
          
          return {
            columnName: condition.columnName,
            tableName: condition.tableName,
            operator: condition.operator,
            test: true,
            subqueryComparator: condition.subqueryComparator,
            value: mappedSubquery // Only the needed fields
          };
        })
      );
    } else {
      // For non-subquery conditions, create a resolved observable
      return of({
        columnName: condition.columnName,
        tableName: condition.tableName,
        operator: condition.operator,
        value: condition.value,
        test: false
      });
    }
  });
  
  return forkJoin(whereConditionsProcessing);
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
  
    // Also remove from group by if present
    const groupByIndex = this.groupByColumns.findIndex(c => c.id === column.id);
    if (groupByIndex !== -1) {
      this.groupByColumns.splice(groupByIndex, 1);
    }
  
    // Also remove from aggregations if present
    for (let i = this.aggregationControls.length - 1; i >= 0; i--) {
      const control = this.aggregationControls.at(i);
      if (control.get('columnId').value === column.id.toString()) {
        this.aggregationControls.removeAt(i);
      }
    }
  
    // Check if table should be removed
    const tableColumns = [
      ...this.selectedColumns.filter(c => c.table.id === column.table.id),
      ...this.whereConditionColumns.filter(c => c.table.id === column.table.id)
    ];
  
    // If no columns for this table remain, remove the table
    if (tableColumns.length === 0) {
      const tableId = column.table.id;
      this.selectedTables = this.selectedTables.filter(t => t.id !== tableId);
      
      // Find and remove any join conditions that involve this table
      for (let i = this.joinClauses.length - 1; i >= 0; i--) {
        const joinControl = this.joinClauses.at(i);
        const firstTableId = joinControl.get('firstTableId').value;
        const secondTableId = joinControl.get('secondTableId').value;
        
        // Remove the join if either the first or second table is the one being removed
        if (firstTableId === tableId || secondTableId === tableId) {
          this.joinClauses.removeAt(i);
        }
      }
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
  // Update form columns
updateFormColumns() {
  const columnIds = [
    ...this.selectedColumns.map(c => c.id),
    ...this.whereConditionColumns.map(c => c.id)
  ];

  this.queryForm.patchValue({
    column: columnIds,
    table: this.selectedTables.map(t => t.name).join(', ')
  });

  // Adjust group by columns based on new aggregation structure
  //this.updateGroupByColumnsAfterAggregation();
}

  getDbs() {
    let idConnexion = Number(localStorage.getItem("idConnection"));
    let idUser = Number(localStorage.getItem("userId"));

    this.userservice.getUserById(idUser).subscribe(data => {

      if (data.type == "Creator") {
        let creator = data as Creator
        this.connexionservice.getConnexionDatabases(idConnexion).subscribe(d =>{
          this.databases = d
          this.databases.forEach(db => {
            db.tables.forEach(table => {
              this.originalTableColumns[table.id] = [...table.columns];
            });
          });

        })
      }
      else {
        let analyst = data as Analyst
        this.analystservice.getAnalystsDatabasess(idUser).subscribe(d =>{
          this.databases = d
          this.databases.forEach(db => {
            db.tables.forEach(table => {
              this.originalTableColumns[table.id] = [...table.columns];
            });
          });
        })
      }

     
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

    //lel ai
    db.tables.forEach(table => {
      this.ai_input += table.name + " [" 
      table.columns.forEach(c => {
        this.ai_input += c.name +", "
      }
    )
    this.ai_input += " ], " 
    });

    this.getSuggestions()

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

 onSubmit(): void {
  const userId = Number(localStorage.getItem('userId'));
  
  if (!userId) {
    console.error('User ID not found in localStorage');
    alert('Error: User not logged in.');
    return;
  }
  
  if (this.queryForm.valid) {
    this.userservice.getUserById(userId).subscribe({
      next: (user) => {
        const formData = this.queryForm.value;

        // Process where conditions first (with potential subqueries)
        this.processWhereConditions(formData.whereClauses).subscribe({
          next: (whereConditions) => {
            // Then process having conditions
            this.processHavingConditions(formData.havingClauses).subscribe({
              next: (havingConditions) => {
                // Get aggregations
                const aggregations: Aggregation[] = this.aggregationControls.value.map((agg: any) => ({
                  columnId: agg.columnId,
                  functionagg: agg.functionagg
                }));

                // Get group by column IDs
                const groupByColumnIds = this.groupByColumns.map(column => column.id);

                const orderByConditions: orderBy = this.orderByControls.value.map((order: any) => ({
                  colId: order.colId,
                  orderType: order.orderType
                }));

                // Validate SQL rules
                let isValid = true;
                let errorMessage = "";
                
                // Rule 1: If using aggregations, all non-aggregated columns must be in GROUP BY
                if (aggregations.length > 0) {
                  // Get all selected column IDs that are not part of aggregations
                  const nonAggregatedColumnIds = this.selectedColumns
                    .filter(col => !aggregations.some(agg => agg.columnId === col.id))
                    .map(col => col.id);
                  
                  // Check if all non-aggregated columns are in GROUP BY
                  const missingGroupByColumns = nonAggregatedColumnIds
                    .filter(colId => !groupByColumnIds.includes(colId));
                  
                  if (missingGroupByColumns.length > 0) {
                    isValid = false;
                    const missingColumns = this.selectedColumns
                      .filter(col => missingGroupByColumns.includes(col.id))
                      .map(col => `${col.name} (${col.table.name})`)
                      .join(', ');
                    
                    errorMessage = `SQL Error: Non-aggregated columns ${missingColumns} must appear in GROUP BY clause`;
                  }
                }
                
                if (!isValid) {
                  alert(errorMessage);
                  return;
                }

                // Construct request payload
                const requestPayload = {
                  req: {
                    sentAt: new Date().toISOString(),
                    sender: {
                      identif: user.identif,
                      mail: user.mail,
                      password: user.password
                    },
                    content: "Fetching data"
                  },
                  tableId: this.selectedTables.map(t => t.id),
                  columnId: aggregations.length > 0 
                    ? this.selectedColumns
                        .filter(col => !aggregations.some(agg => agg.columnId === col.id))
                        .map(c => c.id)
                    : this.selectedColumns.map(c => c.id),
                  groupByColumns: groupByColumnIds,
                  aggregations: aggregations,
                  joinRequest: {
                    joinConditions: this.generateJoinConditions()
                  },
                  filters: whereConditions,
                  havingConditions: havingConditions,
                   orderBy: orderByConditions ? orderByConditions : null,
                   limit: formData.limit ? parseInt(formData.limit) : null
                };

                console.log("Sending request payload:", JSON.stringify(requestPayload, null, 2));
                this.resultSource = 'query';
                this.allResults = [];
                this.reqservice.fetchTableData(requestPayload).subscribe(
                  response => {
                    this.tableData = response;
                    if (this.tableData.length > 0) {
                      this.tableHeaders = Object.keys(this.tableData[0]);
                      this.getReq();
                      this.showSqlButton = true;
                      //this.showAddedNotification();
                    }
                  },
                  error => console.error('Error fetching data:', error)
                );
              },
              error: (error) => {
                console.error('Error processing having conditions:', error);
                alert('Error processing having conditions');
              }
            });
          },
          error: (error) => {
            console.error('Error processing where conditions:', error);
            alert('Error processing where conditions');
          }
        });
      },
      error: (error) => {
        console.error('Error fetching user:', error);
        this.showSqlButton = false;
        alert('Error retrieving user data.');
      }
    });
  }
}
  // Existing methods for where clauses
  get whereClauses(): FormArray {
    return this.queryForm.get('whereClauses') as FormArray;
  }

addWhereCondition() {
  const whereCondition = this.fb.group({
    columnName: ['', Validators.required],
    tableName: ['', Validators.required],
    operator: ['=', Validators.required],
    value: ['', Validators.required],
    test: [false], // Default to false (not a subquery)
    subqueryComparator: ['in'] // Default to 'in' for subqueries
  });
  this.whereClauses.push(whereCondition);
}


  removeWhereCondition(index: number) {
    this.whereClauses.removeAt(index);
  }




// Add getter for orderBy FormArray
get orderByControls(): FormArray {
  return this.queryForm.get('orderBy') as FormArray;
}

// Method to add an order by condition
addOrderByCondition() {
  const orderByCondition = this.fb.group({
    colId: ['', Validators.required],
    columnName: ['', Validators.required],
    tableName: ['', Validators.required],
    orderType: ['ASC', Validators.required]
  });
  this.orderByControls.push(orderByCondition);
}

// Method to remove an order by condition
removeOrderByCondition(index: number) {
  if (index >= 0 && index < this.orderByControls.length) {
    this.orderByControls.removeAt(index);
  }
}

// Method to handle column drop for order by
onColumnDropForOrderBy(event: CdkDragDrop<Column[]>) {
  const draggedColumn = event.previousContainer.data[event.previousIndex];
  
  // Check if column already exists in order by
  const columnExists = this.orderByControls.controls.some(
    control => control.get('columnId').value === draggedColumn.id
  );
  
  if (!columnExists) {
    const table = this.getTableForColumn(draggedColumn);
    
    const orderByCondition = this.fb.group({
      colId: [draggedColumn.id, Validators.required],
      columnName: [draggedColumn.name, Validators.required],
      tableName: [table.name, Validators.required],
      orderType: ['ASC', Validators.required]
    });
    
    this.orderByControls.push(orderByCondition);
    this.addTableToSelectedTables(table);
  }
}

// Method to toggle order type (ASC/DESC)
toggleOrderType(index: number) {
  const orderByControl = this.orderByControls.at(index);
  const currentType = orderByControl.get('orderType').value;
  const newType = currentType === 'ASC' ? 'DESC' : 'ASC';
  orderByControl.get('orderType').setValue(newType);
}




  addTableToWorkspace() {
    // Emit script results if present
    if (this.allResults.length > 0) {
      this.allResults.forEach((table, index) => {
        if (table.rows.length) {
          this.newItemEvent.emit(
            new Graph(
              Date.now() + index,
              [...table.headers],
              [...table.rows],
              'table',
              300,
              200,
              100 + index * 50,
              100 + index * 50,
              null,
              null,
              null,
              null,
              null
            )
          );
        }
      });
    }
    // Emit query builder/AI results if present
    else if (this.tableData.length) {
      this.newItemEvent.emit(
        new Graph(
          Date.now(),
          [...this.tableHeaders],
          [...this.tableData],
          'table',
          300,
          200,
          100,
          100,
          null,
          null,
          null,
          null,
          null
        )
      );
    }
  }

  switch(){
    this.toggle = !this.toggle
  }

  

  fetchResults(scriptId: number): void {
    this.resultSource = 'script';
    console.log(this.resultSource) ;
    console.log("script");// Set result source to script
    this.tableData = []; // Clear query results
    this.tableHeaders = [];
    this.showSqlButton = false;
    this.scriptService.executeScript(scriptId).subscribe(
      (result: any[][]) => {
        this.allResults = result.map(queryResult => {
          const headers = queryResult.length > 0 ? Object.keys(queryResult[0]) : [];
          return {
            headers,
            rows: queryResult
          };
        });
      },
      error => {
        console.error('Error fetching results:', error);
      }
    );
  }


  getReq()  {

    this.reqservice.getUserReq(Number(localStorage.getItem("userId"))).subscribe(data => {this.reqs = data
    
      this.lastreq = this.reqs[this.reqs.length-1];
      //console.log(this.lastreq)
      this.showSqlButton = !!this.lastreq;
    
    });
    
    
    }


    showSql(): void {
      if (this.lastreq && this.lastreq.content) {
        alert(this.lastreq.content); // Replace with modal or other display method if needed
      } else {
        alert('No SQL content available.');
      }
    }



    getScripts()
{
  this.scriptService.getByUser(Number(localStorage.getItem("userId"))).subscribe(data => {
    this.scripts = data 
    console.log(this.scripts.length)
  })
}














send(s:string){

    console.log(1)

    let prompt = 
  "This is the Tables and their columns: " + this.ai_input + ".\n" +
  "Convert the following user input into a SQL query representing an SQL query using table and column names." +
  "Important: write ONLY the query don't say anything else at all and write it on the same line"+".\n" +
  "Important: the query must be compatible for this database type :"+ this.databases[this.selectedDbIndex].dbtype+".\n" +
  "User input: '" + s + "'";

  const tokenCount = Math.ceil(prompt.length / 4.5);
  
  console.log(`Prompt token count: ${tokenCount}`); 
  
  const tokenLimit = 2078;
  const responseMaxTokens = tokenLimit - tokenCount;
  
  console.log(`Max tokens available for the response: ${responseMaxTokens}`);
  
  const maxTokens = Math.min(responseMaxTokens, 1000);

  console.log(maxTokens)


     fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer "+ apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ],
        "max_tokens": maxTokens
      })
    }) .then(response => response.json()) 
    .then(data => {
      console.log(data)
      const reply = data.choices[0]?.message?.content;

      if (reply) {
        let query = reply.replace(/```sql\s*([\s\S]*?)\s*```/, '$1');

         query = query.substring(query.indexOf("SELECT"));


        console.log(query)

        const userId = Number(localStorage.getItem('userId'));


        const jsonString = {
          query:query,
          dbId:this.databases[this.selectedDbIndex].id,
          senderId:userId
        }


      
       
          this.reqservice.executeSqlQuery(jsonString).subscribe(data=>{
            console.log(data)
            this.tableData = data;
            if (this.tableData.length > 0) {
              this.tableHeaders = Object.keys(this.tableData[0]);
            }

          })
        
        }

    }
  )
    .catch(err => {
      console.error("Error fetching response:", err);
    });

  }


  getSuggestions(){
    const userId = Number(localStorage.getItem('userId'));

    const payload = {
      user_id: userId,
    database: this.databases[this.selectedDbIndex]
    }
    console.log(payload)
    this.suggestionsservice.getSuggestions(payload).subscribe(data =>{
      console.log(data)
        this.sug_queries = data.suggestions
    })
  }

  executeQuery(s:String){

    const userId = Number(localStorage.getItem('userId'));


    const jsonString = {
      query:s,
      dbId:this.databases[this.selectedDbIndex].id,
      senderId:userId
    }

    this.reqservice.executeSqlQuery(jsonString).subscribe(data=>{
      console.log(data)
      this.tableData = data;
      if (this.tableData.length > 0) {
        this.tableHeaders = Object.keys(this.tableData[0]);
      }

    })
  }

  returnToDashboard() {
    this.hideQueryBuilder.emit();
  }

  showAddedNotification() {
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000); // Hide after 3 seconds
  }

}
