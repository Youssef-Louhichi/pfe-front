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
import { DatabaseService } from 'src/app/services/database.service';
import { QueryExplainComponent } from '../query-explain/query-explain.component';
import { RelationsDatabaseComponent } from '../relations-database/relations-database.component';
import { QueryHistoryDialogComponent } from '../query-history-dialog/query-history-dialog.component';
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
interface orderBy {
  colId: number;
  orderType: string;
}

interface ColumnWithTable extends Column {
  table: DbTable;
}

interface TableRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
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
    private analystservice: AnalystService, private connexionservice: ConnexionsService, private scriptService: ScriptServiceService, private route: ActivatedRoute
    , private suggestionsservice: SuggestionsService, private dialog: MatDialog, private databaseService: DatabaseService
  ) { }

  @Output() newItemEvent = new EventEmitter<Graph>();
  @Output() hideQueryBuilder = new EventEmitter<void>();


  relations: TableRelation[] = [];
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

  toggle: boolean = true
  ai_input: string = ""
  sug_queries: String[]


  savedRequests: Requete[] = [];
  subqueryPayload: any = null;

  reqs: Requete[];
  lastreq: Requete;
  showSqlButton: boolean = false;
  isDbMode: boolean = true;
  selectedScriptIndex: number = 0;
  showNotification = false;

  // Track which columns have open menus
  columnMenus: Map<number, boolean> = new Map();

  // Track column aggregations
  columnAggregations: Map<number, string> = new Map();

  errorMessage: string = '';
  variableres:boolean = false ;

  ngOnInit(): void {
    this.queryForm = this.fb.group({
      table: ['', Validators.required],
      column: [''],
      filterClauses: this.fb.array([]),
      joinClauses: this.fb.array([]),
      aggregations: this.fb.array([]),
      groupByColumns: this.fb.array([]),
      orderBy: this.fb.array([]),
      limit: ['']
    });

    this.getDbs();
    this.getScripts();
    this.loadSavedRequests();

    if (this.databases && this.databases.length > 0) {
      this.selectedDbIndex = 0;
      this.toggleDb(this.databases[0]);
    }




    const scriptId = this.route.snapshot.paramMap.get('scriptId');
    if (scriptId) {
      this.fetchResults(Number(scriptId));
    }
  }


  get filterClauses(): FormArray {
    return this.queryForm.get('filterClauses') as FormArray;
  }

  getRelations() {
    this.databaseService.getStructure(this.databases[this.selectedDbIndex].id).subscribe({
      next: (data) => {
        this.relations = data;
      },
      error: (err) => {
        console.error('Error loading schema:', err);
      }
    });
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






  getTableColumns(tableId: number): Column[] {
    if (!tableId) return [];

    const table = this.selectedTables.find(t => t.id === +tableId);
    return table ? table.columns : [];
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
    this.interTables = []

    const joinConditions: {
      firstTableId: number;
      firstColumnName: string;
      secondTableId: number;
      secondColumnName: string;
      joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    }[] = [];

    const selectedNames = this.selectedTables.map(t => t.name);
    const selectedSet = new Set(selectedNames);

    // Graph: table name -> related relations (bidirectional)
    const graph = new Map<string, TableRelation[]>();
    for (const rel of this.relations) {
      if (!graph.has(rel.fromTable)) graph.set(rel.fromTable, []);
      if (!graph.has(rel.toTable)) graph.set(rel.toTable, []);
      graph.get(rel.fromTable)!.push(rel);
      graph.get(rel.toTable)!.push({
        fromTable: rel.toTable,
        fromColumn: rel.toColumn,
        toTable: rel.fromTable,
        toColumn: rel.fromColumn,
      });
    }

    // Helper to validate and push a join (both directions)
    const addBidirectionalJoins = (rel: TableRelation) => {
      const from = this.selectedTables.find(t => t.name === rel.fromTable) || this.getTableByName(rel.fromTable);
      const to = this.selectedTables.find(t => t.name === rel.toTable) || this.getTableByName(rel.toTable);
      if (!from || !to) return;

      const fromColOk = from.columns.some(c => c.name === rel.fromColumn);
      const toColOk = to.columns.some(c => c.name === rel.toColumn);
      if (!fromColOk || !toColOk) return;

      joinConditions.unshift({
        firstTableId: from.id,
        firstColumnName: rel.fromColumn,
        secondTableId: to.id,
        secondColumnName: rel.toColumn,
        joinType: 'INNER',
      });
      joinConditions.unshift({
        firstTableId: to.id,
        firstColumnName: rel.toColumn,
        secondTableId: from.id,
        secondColumnName: rel.fromColumn,
        joinType: 'INNER',
      });
    };

    // Step 1: Get all direct relations between selected tables
    const usedDirectRelations = new Set<string>();
    for (const rel of this.relations) {
      const { fromTable, toTable } = rel;
      if (selectedSet.has(fromTable) && selectedSet.has(toTable)) {
        const key = [fromTable, rel.fromColumn, toTable, rel.toColumn].join('|');
        if (!usedDirectRelations.has(key)) {
          addBidirectionalJoins(rel);
          usedDirectRelations.add(key);
        }
      }
    }

    // Step 2: Only find paths if direct join count < n - 1
    const n = this.selectedTables.length;
    const uniquePairs = new Set<string>();
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        uniquePairs.add([this.selectedTables[i].name, this.selectedTables[j].name].sort().join('|'));
      }
    }

    const existingJoinPairs = new Set<string>();
    for (const rel of this.relations) {
      const pairKey = [rel.fromTable, rel.toTable].sort().join('|');
      if (selectedSet.has(rel.fromTable) && selectedSet.has(rel.toTable)) {
        existingJoinPairs.add(pairKey);
      }
    }

    const neededJoins = n - 1;
    if (existingJoinPairs.size >= neededJoins) {
      console.log('Direct joins are sufficient. Skipping intermediate table logic.');
      return joinConditions;
    }

    // Step 3: Try to connect remaining disconnected pairs using BFS
    const findPath = (start: string, end: string): TableRelation[] | null => {
      const queue: { current: string; path: TableRelation[] }[] = [{ current: start, path: [] }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { current, path } = queue.shift()!;
        if (current === end) return path;

        visited.add(current);
        const neighbors = graph.get(current) || [];
        for (const rel of neighbors) {
          if (!visited.has(rel.toTable)) {
            queue.push({ current: rel.toTable, path: [...path, rel] });
          }
        }
      }

      return null;
    };

    for (const pair of uniquePairs) {
      if (existingJoinPairs.has(pair)) continue;

      const [a, b] = pair.split('|');
      const path = findPath(a, b);
      if (path) {
        for (const rel of path) {
          const key = [rel.fromTable, rel.fromColumn, rel.toTable, rel.toColumn].join('|');
          if (!usedDirectRelations.has(key)) {
            addBidirectionalJoins(rel);
            usedDirectRelations.add(key);
          }
        }
      }
    }

        console.log('Generated join conditions:', this.selectedTables);
    console.log('Generated join conditions:', joinConditions);
    return joinConditions;
  }

  interTables: DbTable[]

  private getTableByName(name: string): DbTable | undefined {
    const table = this.databases[this.selectedDbIndex].tables.find(t => t.name === name)
    if (table && !this.selectedTables.some(t => t.name === name) && !this.interTables.some(t => t.name === name)) {
      this.interTables.push(table);
    }
    return table || null;
  }

  private addTableToSelectedTables(table: DbTable) {
    if (!this.selectedTables.some(t => t.id === table.id)) {
      this.selectedTables.push(table);


    }
  }

  removeTable(table: DbTable) {
    this.selectedTables = this.selectedTables.filter(t => t.id !== table.id);

    this.selectedColumns = this.selectedColumns.filter(c => c.table.id !== table.id);
    this.whereConditionColumns = this.whereConditionColumns.filter(c => c.table.id !== table.id);

    this.updateFormColumns();
  }

  removeColumn(column: ColumnWithTable, type: 'columns' | 'conditions') {
    // Remove any aggregation for this column
    if (type === 'columns' && this.isColumnAggregated(column.id)) {
      this.removeAggregationFromColumn(column);
    }

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

    // Check if table should be removed
    const tableColumns = [
      ...this.selectedColumns.filter(c => c.table.id === column.table.id),
      ...this.whereConditionColumns.filter(c => c.table.id === column.table.id)
    ];

    // If no columns for this table remain, remove the table
    if (tableColumns.length === 0) {
      const tableId = column.table.id;
      this.selectedTables = this.selectedTables.filter(t => t.id !== tableId);
    }

    // Update form
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
        this.connexionservice.getConnexionDatabases(idConnexion).subscribe(d => {
          this.databases = d
          this.databases.forEach(db => {
            db.tables.forEach(table => {
              this.originalTableColumns[table.id] = [...table.columns];
            });
          });

        })
      }
      else {
        this.analystservice.getAnalystsDatabasess(idUser).subscribe(d => {
          this.databases = d.filter(d => d.connexion.id == idConnexion)
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

    this.getRelations()


    this.getRelations()


    db.tables.forEach(table => {
      this.ai_input += table.name + " ["
      table.columns.forEach(c => {
        this.ai_input += c.name + ", "
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
     this.errorMessage = ''
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
              // Get aggregations
              const aggregations: Aggregation[] = this.aggregationControls.value.map((agg: any) => ({
                columnId: agg.columnId,
                functionagg: agg.functionagg
              }));

              // Get group by column IDs
              this.refreshGroupByColumns()
              const groupByColumnIds = this.groupByColumns.map(column => column.id);

              //get joins
              const joins = this.generateJoinConditions();

              const orderByConditions: orderBy = this.orderByControls.value.map((order: any) => ({
                colId: order.colId,
                orderType: order.orderType
              }));

              // Validate SQL rules
              let isValid = true;
              let errorMessage = "";

              // Rule 1: If using aggregations, all non-aggregated columns must be in GROUP BY
              if (aggregations.length > 0 || havingConditions.length > 0) {
                // Get all selected column IDs that are not part of aggregations
                const aggregatedColumnIds = new Set(aggregations.map(agg => agg.columnId));
                const nonAggregatedColumnIds = this.selectedColumns
                  .filter(col => !aggregatedColumnIds.has(col.id))
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
                tableId: this.getOrderedTableIds(this.selectedTables, this.interTables, joins),
                columnId: this.selectedColumns
                  .filter(col => !this.isColumnAggregated(col.id))
                  .map(c => c.id),
                groupByColumns: groupByColumnIds,
                aggregations: aggregations,
                joinRequest: {
                  joinConditions: joins
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
                    this.loadSavedRequests();
                    this.showSqlButton = true;
                  }
                },
                error => {
                  console.log('Error fetching data:', error);
                  this.errorMessage = 'Please check your query .';
                  this.tableData = [];
                  this.tableHeaders = [];
                }
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

 getOrderedTableIds(
    selectedTables: DbTable[],
    interTables: DbTable[],
    joinConditions: JoinCondition[]
): number[] {
    const allTableIds = selectedTables.map(t => t.id).concat(interTables.map(t => t.id));
    
    if (joinConditions.length === 0 || allTableIds.length === 0) {
        return allTableIds;
    }

    const firstTableId = allTableIds[0];
    const firstJoin = joinConditions[0];

    if (firstJoin.firstTableId === firstTableId || firstJoin.secondTableId === firstTableId) {
        return allTableIds; 
    }

    const validFirstIds = [firstJoin.firstTableId, firstJoin.secondTableId].filter(id => 
        allTableIds.includes(id)
    );

    if (validFirstIds.length === 0) {
        return allTableIds; 
    }

    const reorderedIds = [
        validFirstIds[0], ...allTableIds.filter(id => id !== validFirstIds[0]) 
    ];

    return reorderedIds;
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


  getReq() {

    this.reqservice.getUserReq(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.reqs = data

      this.lastreq = this.reqs[this.reqs.length - 1];
      this.showSqlButton = !!this.lastreq;

    });


  }

  /**
   * Analyze and explain the SQL query using AI
   * @param content SQL query to explain
   * @returns Promise with the explanation
   */
  explainSql(content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a prompt for the AI to explain the SQL query
      const prompt =
        "Below is an SQL query. Please analyze and explain it in detail:\n\n" +
        content + "\n\n" +
        "Please explain:\n" +
        "1. What tables are being queried\n" +
        "2. What joins are being performed and why\n" +
        "3. What filters are being applied\n" +
        "4. What aggregations or calculations are happening\n" +
        "5. What the query is trying to accomplish overall\n\n" +
        "Format your response in markdown with sections for each part of the query.";

      // Estimate token count (same as in send method)
      const tokenCount = Math.ceil(prompt.length / 4.5);
      const tokenLimit = 2078;
      const responseMaxTokens = tokenLimit - tokenCount;
      const maxTokens = Math.min(responseMaxTokens, 1000);

      // Call the OpenRouter API
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
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
      })
        .then(response => response.json())
        .then(data => {
          console.log("AI response:", data);
          const explanation = data.choices?.[0]?.message?.content || "Sorry, couldn't generate an explanation.";
          resolve(explanation);
        })
        .catch(err => {
          console.error("Error explaining SQL:", err);
          reject("Error explaining SQL query. Please try again.");
        });
    });
  }

  /**
   * Show the SQL query in a dialog with option to explain it
   */
  showSql(): void {
    if (this.lastreq && this.lastreq.content) {
      // Open the QueryExplain dialog with the SQL content
      const dialogRef = this.dialog.open(QueryExplainComponent, {
        width: '80%',
        maxWidth: '800px',
        data: {
          sql: this.lastreq.content,
          explanation: null
        }
      });

      // Handle the explain button click from the dialog
      dialogRef.componentInstance.explainRequest.subscribe(() => {
        dialogRef.componentInstance.loading = true;

        this.explainSql(this.lastreq.content)
          .then(explanation => {
            dialogRef.componentInstance.data.explanation = explanation;
            dialogRef.componentInstance.loading = false;
          })
          .catch(error => {
            dialogRef.componentInstance.error = error;
            dialogRef.componentInstance.loading = false;
          });
      });
    } else {
      alert('No SQL content available.');
    }
  }

  getScripts() {
    this.scriptService.getByUser(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.scripts = data
      console.log(this.scripts.length)
    })
  }

  send(s: string) {

    console.log(1)

    let prompt =
      "This is the Tables and their columns: " + this.ai_input + ".\n" +
      "Convert the following user input into a SQL query representing an SQL query using table and column names." +
      "Important: write ONLY the query don't say anything else at all and write it on the same line" + ".\n" +
      "Important: the query must be compatible for this database type :" + this.databases[this.selectedDbIndex].dbtype + ".\n" +
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
        Authorization: "Bearer " + apiKey,
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
    }).then(response => response.json())
      .then(data => {
        console.log(data)
        const reply = data.choices[0]?.message?.content;

        if (reply) {
          let query = reply.replace(/```sql\s*([\s\S]*?)\s*```/, '$1');

          query = query.substring(query.indexOf("SELECT"));


          console.log(query)

          const userId = Number(localStorage.getItem('userId'));


          const jsonString = {
            query: query,
            dbId: this.databases[this.selectedDbIndex].id,
            senderId: userId
          }




          this.reqservice.executeSqlQuery(jsonString).subscribe(data => {
            console.log(data)
            this.tableData = data;
            if (this.tableData.length > 0) {
              this.tableHeaders = Object.keys(this.tableData[0]);
               this.variableres = true ;
            }

          })

        }

      }
      )
      .catch(err => {
        console.error("Error fetching response:", err);
      });

  }


  getSuggestions() {
    const userId = Number(localStorage.getItem('userId'));

    const payload = {
      user_id: userId,
      database: this.databases[this.selectedDbIndex]
    }
    console.log(payload)
    this.suggestionsservice.getSuggestions(payload).subscribe(data => {
      console.log(data)
      this.sug_queries = data.suggestions
    })
  }

  executeQuery(s: String) {

    const userId = Number(localStorage.getItem('userId'));


    const jsonString = {
      query: s,
      dbId: this.databases[this.selectedDbIndex].id,
      senderId: userId
    }

    this.reqservice.executeSqlQuery(jsonString).subscribe(data => {
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

  /**
   * Check if there are results available to add to workspace
   */
  hasResults(): boolean {
    // Check if we have results from either query builder or script execution
    return (this.resultSource === 'query' && this.tableData && this.tableData.length > 0) ||
      (this.resultSource === 'script' && this.allResults && this.allResults.length > 0);
  }

  /**
   * Show notification when results are added to workspace
   */
  showAddedNotification(): void {
    if (!this.hasResults()) {
      return; // Don't show notification if no results
    }

    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000); // Hide after 3 seconds
  }

  showRelations() {
    this.dialog.open(RelationsDatabaseComponent, {
      data: this.relations,
      width: '65vw',
      maxHeight: '80vh'
    }

    );


  }

  showDiag() {
    this.dialog.open(DatabaseDiagramComponent, {
      data: { relations: this.relations, database: this.databases[this.selectedDbIndex] },
      width: '100vw',
      height: '100vh'
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
      control => control.get('colId').value === draggedColumn.id
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

  // Check if a column has aggregation function applied
  isColumnAggregated(columnId: number): boolean {
    return this.columnAggregations.has(columnId);
  }

  // Get the aggregation function for a column
  getColumnAggregation(columnId: number): string {
    return this.columnAggregations.get(columnId) || '';
  }

  // Toggle column menu visibility
  toggleColumnMenu(columnId: number): void {
    // Close all other menus first
    this.columnMenus.forEach((value, key) => {
      if (key !== columnId) {
        this.columnMenus.set(key, false);
      }
    });

    // Toggle this menu
    const isOpen = this.columnMenus.get(columnId) || false;
    this.columnMenus.set(columnId, !isOpen);
  }

  // Check if a column's menu is open
  isColumnMenuOpen(columnId: number): boolean {
    return this.columnMenus.get(columnId) || false;
  }

  // Apply an aggregation function to a column
  applyAggregationToColumn(column: ColumnWithTable, functionName: string): void {
    // Save the aggregation for this column
    this.columnAggregations.set(column.id, functionName);

    // Close the menu
    this.columnMenus.set(column.id, false);

    // Add to aggregations form array
    const existingAggIndex = this.findAggregationIndexForColumn(column.id);

    if (existingAggIndex === -1) {
      // Add new aggregation
      const aggregation = this.fb.group({
        columnId: [column.id, Validators.required],
        columnName: [column.name, Validators.required],
        tableId: [column.table.id, Validators.required],
        functionagg: this.fb.array([this.fb.control(functionName)])
      });

      this.aggregationControls.push(aggregation);
    } else {
      // Update existing aggregation
      const aggregation = this.aggregationControls.at(existingAggIndex);
      const functionsArray = aggregation.get('functionagg') as FormArray;
      functionsArray.clear();
      functionsArray.push(this.fb.control(functionName));
    }

    // Update groupBy columns if needed
    this.updateGroupByColumnsAfterAggregation();
  }

  // Remove aggregation from a column
  removeAggregationFromColumn(column: ColumnWithTable): void {
    // Remove the saved aggregation
    this.columnAggregations.delete(column.id);

    // Close the menu
    this.columnMenus.set(column.id, false);

    // Remove from aggregations form array
    const existingAggIndex = this.findAggregationIndexForColumn(column.id);

    if (existingAggIndex !== -1) {
      this.aggregationControls.removeAt(existingAggIndex);
    }

    // Update groupBy columns
    this.updateGroupByColumnsAfterAggregation();
  }

  // Helper to find an aggregation by column ID
  private findAggregationIndexForColumn(columnId: number): number {
    for (let i = 0; i < this.aggregationControls.length; i++) {
      const control = this.aggregationControls.at(i);
      if (Number(control.get('columnId').value) === columnId) {
        return i;
      }
    }
    return -1;
  }

  // Method to refresh group by columns based on selected columns
  refreshGroupByColumns(): void {
    // Get all aggregated column IDs
    const aggregatedColumnIds = new Set(Array.from(this.columnAggregations.keys()));

    // Get all selected column IDs that are not aggregated
    const nonAggregatedColumns = this.selectedColumns.filter(c => !aggregatedColumnIds.has(c.id));

    // Find columns in group by that aren't in selected columns
    const invalidGroupByColumns = this.groupByColumns.filter(
      groupByCol => !this.selectedColumns.some(selectCol => selectCol.id === groupByCol.id)
    );

    // Remove invalid columns
    if (invalidGroupByColumns.length > 0) {
      for (const col of invalidGroupByColumns) {
        const index = this.groupByColumns.findIndex(c => c.id === col.id);
        if (index !== -1) {
          this.groupByColumns.splice(index, 1);
        }
      }
    }

    // Add non-aggregated columns that aren't already in group by
    for (const col of nonAggregatedColumns) {
      if (!this.groupByColumns.some(c => c.id === col.id)) {
        this.groupByColumns.push(col);
      }
    }
  }

  // Method to add a column to order by
  addColumnToOrderBy(column: ColumnWithTable): void {
    // Close the menu
    this.columnMenus.set(column.id, false);

    // Check if column already exists in order by
    const columnExists = this.orderByControls.controls.some(
      control => control.get('colId').value === column.id
    );

    if (!columnExists) {
      const orderByCondition = this.fb.group({
        colId: [column.id, Validators.required],
        columnName: [column.name, Validators.required],
        tableName: [column.table.name, Validators.required],
        orderType: ['ASC', Validators.required]
      });

      this.orderByControls.push(orderByCondition);
    }
  }

  /**
   * Reset all form fields and selections
   */
  resetForm(): void {
    // Clear all form arrays
    this.filterClauses.clear();
    this.aggregationControls.clear();
    this.orderByControls.clear();

    // Reset form basic values
    this.queryForm.patchValue({
      table: '',
      column: '',
      limit: ''
    });

    // Clear selected columns and tables
    this.selectedColumns = [];
    this.selectedTables = [];
    this.whereConditionColumns = [];
    this.groupByColumns = [];
    this.interTables = [];

    // Clear aggregations and menus
    this.columnAggregations.clear();
    this.columnMenus.clear();

    // Clear results
    this.tableData = [];
    this.tableHeaders = [];
    this.allResults = [];
    this.showSqlButton = false;

    // Reset dropdown visibility
    this.showColumns = {};

    // Reset for next query
    this.resultSource = null;
  }

  /**
   * Send column to filter section
   * If column has aggregation, create a HAVING filter
   * Otherwise create a WHERE filter
   */
  sendColumnToFilter(column: ColumnWithTable): void {
    // Close the menu
    this.columnMenus.set(column.id, false);

    // Check if column has aggregation
    const hasAggregation = this.isColumnAggregated(column.id);
    const aggregationType = hasAggregation ? this.getColumnAggregation(column.id) : '';

    // Create filter condition
    const filterCondition = this.fb.group({
      columnName: [column.name, Validators.required],
      columnId: [column.id, Validators.required],
      tableName: [column.table.name, Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required],
      functionType: [aggregationType], // Empty for WHERE, populated for HAVING
      showFunctionMenu: [false],
      test: [false], // Not a subquery by default
      subqueryComparator: ['in'] // Default for subqueries
    });

    // Add to filter clauses
    this.filterClauses.push(filterCondition);
  }

  showHistory(): void {
    this.dialog.open(QueryHistoryDialogComponent, {
      width: '800px',
      maxHeight: '80vh'
    });
  }

  exportToCsv(): void {
    if (!this.tableData || this.tableData.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from the first row
    const headers = this.tableHeaders;
    
    // Convert data to CSV format
    const csvContent = [
      headers.join('|'), // Header row
      ...this.tableData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        }).join('|')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
