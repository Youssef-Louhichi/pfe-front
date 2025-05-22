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
import { DatabaseDiagramComponent } from '../database-diagram/database-diagram.component';
import { MatDialog } from '@angular/material/dialog';
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
    ,private suggestionsservice:SuggestionsService , private dialog: MatDialog
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
      filterClauses: this.fb.array([]),
      joinClauses: this.fb.array([]),
      aggregations: this.fb.array([]),
      groupByColumns: this.fb.array([]),
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


  get filterClauses(): FormArray {
    return this.queryForm.get('filterClauses') as FormArray;
  }

  get havingClauses(): FormArray {
    return this.queryForm.get('havingClauses') as FormArray;
  }

  get aggregationControls(): FormArray {
    return this.queryForm.get('aggregations') as FormArray;
  }

  get groupByControls(): FormArray {
    return this.queryForm.get('groupByColumns') as FormArray;
  }

  get orderByControls(): FormArray {
    return this.queryForm.get('orderBy') as FormArray;
  }

  get joinClauses(): FormArray {
    return this.queryForm.get('joinClauses') as FormArray;
  }

  addFilterCondition() {
    const filterCondition = this.fb.group({
      columnName: ['', Validators.required],
      columnId: ['', Validators.required],
      tableName: ['', Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required],
      functionType: [''],
      showFunctionMenu: [false],
      test: [false],
      subqueryComparator: ['in']
    });
    this.filterClauses.push(filterCondition);
  }

  toggleFunctionMenu(index: number) {
    const condition = this.filterClauses.at(index);
    const currentValue = condition.get('showFunctionMenu').value;
    condition.get('showFunctionMenu').setValue(!currentValue);
  }

  onFunctionTypeChange(index: number) {
    const condition = this.filterClauses.at(index);
    condition.get('showFunctionMenu').setValue(false);
  }

  removeFilterCondition(index: number) {
    if (index >= 0 && index < this.filterClauses.length) {
      this.filterClauses.removeAt(index);
    }
  }

  onColumnDropForFilter(event: CdkDragDrop<Column[]>) {
    const draggedColumn = event.previousContainer.data[event.previousIndex];
    
    const columnExists = this.filterClauses.controls.some(
      control => control.get('columnId').value === draggedColumn.id
    );
    
    if (!columnExists) {
      const table = this.getTableForColumn(draggedColumn);
      
      const filterCondition = this.fb.group({
        columnName: [draggedColumn.name, Validators.required],
        columnId: [draggedColumn.id, Validators.required],
        tableName: [table.name, Validators.required],
        operator: ['=', Validators.required],
        value: ['', Validators.required],
        functionType: [''],
        showFunctionMenu: [false],
        test: [false],
        subqueryComparator: ['in']
      });
      
      this.filterClauses.push(filterCondition);
      this.addTableToSelectedTables(table);
    }
  }

  onFilterSubqueryToggle(index: number): void {
    const filterControl = this.filterClauses.at(index);
    const isSubquery = filterControl.get('test').value;
    
    if (isSubquery) {
      filterControl.get('value').setValue('');
      
      if (this.savedRequests.length === 0) {
        this.loadSavedRequests();
      }
    }
  }

  processFilterConditions(): Observable<{ whereConditions: any[], havingConditions: any[] }> {
    if (!this.filterClauses.controls || this.filterClauses.controls.length === 0) {
      return of({ whereConditions: [], havingConditions: [] });
    }
    
    const whereFilters: any[] = [];
    const havingFilters: any[] = [];
    
    this.filterClauses.controls.forEach(control => {
      const condition = control.value;
      
      if (condition.functionType) {
        havingFilters.push({
          functionhaving: condition.functionType,
          columnId: condition.columnId,
          columnName: condition.columnName,
          tableName: condition.tableName,
          operator: condition.operator,
          value: condition.value,
          test: condition.test,
          subqueryComparator: condition.subqueryComparator
        });
      } else {
        whereFilters.push({
          columnName: condition.columnName,
          tableName: condition.tableName,
          operator: condition.operator,
          value: condition.value,
          test: condition.test,
          subqueryComparator: condition.subqueryComparator
        });
      }
    });
    
    const whereObservable = this.processConditions(whereFilters, false);
    
    const havingObservable = this.processConditions(havingFilters, true);
    
    return forkJoin([whereObservable, havingObservable]).pipe(
      map(([whereConditions, havingConditions]) => ({ whereConditions, havingConditions }))
    );
  }

  processConditions(conditions: any[], isHaving: boolean): Observable<any[]> {
    if (!conditions || conditions.length === 0) {
      return of([]);
    }
    
    const conditionsProcessing: Observable<any>[] = conditions.map(condition => {
      if (condition.test) {
        return this.getRequestById(condition.value).pipe(
          map(subqueryReq => {
            const typedReq = subqueryReq as {
              sentAt: string;
              sender?: {
                identif: string;
                mail: string;
                password: string;
              };
              content: string;
              tableId: number;
              columnId: number;
              aggregation: any[];
              groupByColumns: any[];
              joinConditions: any[];
              filters: any[];
              havingConditions: any[];
            };
            
            const mappedSubquery = {
              sentAt: typedReq.sentAt,
              sender: {
                identif: typedReq.sender?.identif,
                mail: typedReq.sender?.mail,
                password: typedReq.sender?.password
              },
              content: typedReq.content,
              tableId: typedReq.tableId,
              columnId: typedReq.columnId,
              aggregation: typedReq.aggregation || [],
              groupByColumns: typedReq.groupByColumns || [],
              joinConditions: typedReq.joinConditions || [],
              filters: typedReq.filters || [],
              havingConditions: typedReq.havingConditions || []
            };
            
            if (isHaving) {
              return {
                function: condition.functionhaving,
                columnId: condition.columnId,
                operator: condition.operator,
                test: true,
                subqueryComparator: condition.subqueryComparator,
                value: mappedSubquery
              };
            } else {
              return {
                columnName: condition.columnName,
                tableName: condition.tableName,
                operator: condition.operator,
                test: true,
                subqueryComparator: condition.subqueryComparator,
                value: mappedSubquery
              };
            }
          })
        );
      } else {
        if (isHaving) {
          return of({
            function: condition.functionhaving,
            columnId: condition.columnId,
            operator: condition.operator,
            value: condition.value,
            test: false
          });
        } else {
          return of({
            columnName: condition.columnName,
            tableName: condition.tableName,
            operator: condition.operator,
            value: condition.value,
            test: false
          });
        }
      }
    });
    
    return forkJoin(conditionsProcessing);
  }

  toggleSelectionMode(): void {
    this.isDbMode = !this.isDbMode;
  }

  selectAllTableColumns(table: DbTable, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    const columnsWithTable: ColumnWithTable[] = table.columns.map(column => {
      return {
        ...column,
        table: table
      };
    });
    
    columnsWithTable.forEach(columnWithTable => {
      if (!this.selectedColumns.some(c => c.id === columnWithTable.id)) {
        this.selectedColumns.push(columnWithTable);
        
        this.addTableToSelectedTables(table);
      }
    });
    
    this.updateFormColumns();
  }
  
  isTableFullySelected(table: DbTable): boolean {
    if (table.columns.length === 0) {
      return false;
    }
    
    return table.columns.every(column => 
      this.selectedColumns.some(selectedColumn => 
        selectedColumn.id === column.id
      )
    );
  }

  addAggregation() {
    const aggregation = this.fb.group({
      columnId: ['', Validators.required],
      columnName: ['', Validators.required],
      tableId: ['', Validators.required],
      functionagg: this.fb.array([this.fb.control('COUNT')])
    });
    this.aggregationControls.push(aggregation);
  }

  onAggregationFunctionChange(aggregationIndex: number, event: any) {
    const selectedFunction = event.target.value;
    const aggregation = this.aggregationControls.at(aggregationIndex);
    const functionsArray = aggregation.get('functionagg') as FormArray;
    
    functionsArray.clear();
    functionsArray.push(this.fb.control(selectedFunction));
  }

  addAggregationFunction(index: number, functionType: string = 'COUNT') {
    const aggregation = this.aggregationControls.at(index);
    const functionsArray = aggregation.get('functionagg') as FormArray;
    
    if (functionsArray.length > 0) {
      functionsArray.clear();
    }
    
    functionsArray.push(this.fb.control(functionType));
  }

  removeAggregation(index: number) {
    if (index >= 0 && index < this.aggregationControls.length) {
      this.aggregationControls.removeAt(index);
      this.updateGroupByColumnsAfterAggregation();
    }
  }

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
        functionagg: this.fb.array([this.fb.control('COUNT')])
      });
      
      this.aggregationControls.push(aggregation);
      this.addTableToSelectedTables(table);
      this.updateGroupByColumnsAfterAggregation();
    }
  }

  updateGroupByColumnsAfterAggregation() {
    const aggregatedColumnIds = this.aggregationControls.controls.map(
      control => Number(control.get('columnId').value)
    );
   console.log("soiiososososos");
    this.selectedColumns.forEach(column => {
      if (!aggregatedColumnIds.includes(column.id) && 
          !this.groupByColumns.some(gc => gc.id === column.id)) {
        this.groupByColumns.push(column);
      }
    });
  }

  onColumnDropForGroupBy(event: CdkDragDrop<Column[]>) {
    const draggedColumn = event.previousContainer.data[event.previousIndex];
    
    const columnExists = this.groupByColumns.some(c => c.id === draggedColumn.id);
    
    if (!columnExists) {
      const columnWithTable: ColumnWithTable = {
        ...draggedColumn,
        table: this.getTableForColumn(draggedColumn)
      };
      
      this.groupByColumns.push(columnWithTable);
      
      this.addTableToSelectedTables(columnWithTable.table);
      
      if (!this.selectedColumns.some(c => c.id === columnWithTable.id)) {
        this.selectedColumns.push(columnWithTable);
        this.updateFormColumns();
      }
    }
  }
  
  removeGroupByColumn(index: number) {
    if (index >= 0 && index < this.groupByColumns.length) {
      this.groupByColumns.splice(index, 1);
    }
  }

  getAvailableColumns(): ColumnWithTable[] {
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

  drop(event: CdkDragDrop<ColumnWithTable[]>, type: 'columns' | 'conditions') {
    const targetArray = type === 'columns' ? this.selectedColumns : this.whereConditionColumns;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const draggedColumn = event.previousContainer.data[event.previousIndex];

      const columnExists = targetArray.some(c => c.id === draggedColumn.id);

      if (!columnExists) {
        const columnWithTable: ColumnWithTable = {
          ...draggedColumn,
          table: this.getTableForColumn(draggedColumn)
        };

        copyArrayItem(
          event.previousContainer.data,
          targetArray,
          event.previousIndex,
          event.currentIndex
        );

        this.addTableToSelectedTables(columnWithTable.table);

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

      if (this.selectedTables.length === 2) {
        this.addJoinCondition();
      }
    }
  }

  removeTable(table: DbTable) {
    this.selectedTables = this.selectedTables.filter(t => t.id !== table.id);

    this.selectedColumns = this.selectedColumns.filter(c => c.table.id !== table.id);
    this.whereConditionColumns = this.whereConditionColumns.filter(c => c.table.id !== table.id);

    this.updateFormColumns();
  }

  removeColumn(column: ColumnWithTable, type: 'columns' | 'conditions') {
    const targetArray = type === 'columns' ? this.selectedColumns : this.whereConditionColumns;
  
    const index = targetArray.findIndex(c => c.id === column.id);
    if (index !== -1) {
      targetArray.splice(index, 1);
    }
  
    const groupByIndex = this.groupByColumns.findIndex(c => c.id === column.id);
    if (groupByIndex !== -1) {
      this.groupByColumns.splice(groupByIndex, 1);
    }
  
    for (let i = this.aggregationControls.length - 1; i >= 0; i--) {
      const control = this.aggregationControls.at(i);
      if (control.get('columnId').value === column.id.toString()) {
        this.aggregationControls.removeAt(i);
      }
    }
  
    const tableColumns = [
      ...this.selectedColumns.filter(c => c.table.id === column.table.id),
      ...this.whereConditionColumns.filter(c => c.table.id === column.table.id)
    ];
  
    if (tableColumns.length === 0) {
      const tableId = column.table.id;
      this.selectedTables = this.selectedTables.filter(t => t.id !== tableId);
      
      for (let i = this.joinClauses.length - 1; i >= 0; i--) {
        const joinControl = this.joinClauses.at(i);
        const firstTableId = joinControl.get('firstTableId').value;
        const secondTableId = joinControl.get('secondTableId').value;
        
        if (firstTableId === tableId || secondTableId === tableId) {
          this.joinClauses.removeAt(i);
        }
      }
    }
  
    this.updateFormColumns();
  }

  isColumnSelected(columnId: number, type: 'columns' | 'conditions'): boolean {
    const targetArray = type === 'columns' ? this.selectedColumns : this.whereConditionColumns;
    return targetArray.filter(c => c.id === columnId).length > 1;
  }

  updateFormColumns() {
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

      if (data.type == "Creator") {
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
        this.analystservice.getAnalystsDatabasess(idUser).subscribe(d =>{
          this.databases = d.filter(d=> d.connexion.id == idConnexion)
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

    for (const dbName in this.showDatabases) {
      this.showDatabases[dbName] = false;
    }

    this.showDatabases[db.name] = true;

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

          this.processFilterConditions().subscribe({
            next: ({ whereConditions, havingConditions }) => {
              const aggregations: Aggregation[] = this.aggregationControls.value.map((agg: any) => ({
                columnId: agg.columnId,
                functionagg: agg.functionagg
              }));

              const groupByColumnIds = this.groupByColumns.map(column => column.id);

              const orderByConditions: orderBy = this.orderByControls.value.map((order: any) => ({
                colId: order.colId,
                orderType: order.orderType
              }));

              let isValid = true;
              let errorMessage = "";
              
              if (aggregations.length > 0 || havingConditions.length > 0) {
                const nonAggregatedColumnIds = this.selectedColumns
                  .filter(col => !aggregations.some(agg => agg.columnId === col.id))
                  .map(col => col.id);
                
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
                  }
                },
                error => console.error('Error fetching data:', error)
              );
            },
            error: (error) => {
              console.error('Error processing filter conditions:', error);
              alert('Error processing filter conditions');
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

  getReq()  {

    this.reqservice.getUserReq(Number(localStorage.getItem("userId"))).subscribe(data => {this.reqs = data
    
      this.lastreq = this.reqs[this.reqs.length-1];
      this.showSqlButton = !!this.lastreq;
    
    });
    
    
    }

  showSql(): void {
    if (this.lastreq && this.lastreq.content) {
      alert(this.lastreq.content);
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
    }, 3000);
  }

  showRelations(){
 this.dialog.open(DatabaseDiagramComponent, {
        data:this.databases[this.selectedDbIndex].id,
        width: '65vw',
        maxHeight: '80vh'
      }
            
      );
  
      
}

getRequestById(reqId: number): Observable<any> {
  return this.reqservice.getReqById(reqId).pipe(
    map(req => {
      // Return the request data that will be used as a subquery
      return req;
    })
  );
}

fetchResults(scriptId: number): void {
  this.resultSource = 'script';
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

addOrderByCondition() {
  const orderByCondition = this.fb.group({
    colId: ['', Validators.required],
    columnName: ['', Validators.required],
    tableName: ['', Validators.required],
    orderType: ['ASC', Validators.required]
  });
  this.orderByControls.push(orderByCondition);
}

removeOrderByCondition(index: number) {
  if (index >= 0 && index < this.orderByControls.length) {
    this.orderByControls.removeAt(index);
  }
}

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

switch() {
  this.toggle = !this.toggle;
}
}
