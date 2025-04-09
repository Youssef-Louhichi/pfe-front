import { CdkDragDrop, copyArrayItem, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Analyst } from 'src/app/models/analyst';
import { Column } from 'src/app/models/column';
import { Creator } from 'src/app/models/creator';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { Graph } from 'src/app/models/graph';
//import { WhereClause } from 'src/app/models/where-clause';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
const apiKey = environment.openRouterApiKey;


interface WhereClause {
  columnName: string;
  operator: string;
  value: string;
  tableName: string
}
interface Aggregation {
  columnId: number;
  function: string;
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
  selectedColumnIds: Set<number> = new Set();

  groupByColumns: ColumnWithTable[] = [];
availableAggFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

  originalTableColumns: { [tableId: number]: Column[] } = {};

  toggle:boolean = true
  columns:string = ""
  tables:string = ""

  
  

  ngOnInit(): void {
    this.queryForm = this.fb.group({
      table: ['', Validators.required],
      column: ['', Validators.required],
      whereClauses: this.fb.array([]),
      joinClauses: this.fb.array([]),
      aggregations: this.fb.array([]),
      groupByColumns: this.fb.array([])
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
      function: ['COUNT', Validators.required]
    });
    this.aggregationControls.push(aggregation);
  }
  
  // Method to remove an aggregation
  removeAggregation(index: number) {
    this.aggregationControls.removeAt(index);
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
    // Check if column already exists in conditions
    const draggedColumn = event.previousContainer.data[event.previousIndex];

    const columnExists = this.whereClauses.controls.some(
      control => control.get('columnName').value === draggedColumn.name
    );

    if (!columnExists) {
      // Create a new where clause form group
      console.log("taw");
      const whereCondition = this.fb.group({
        columnName: [draggedColumn.name, Validators.required],
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

      if (data.type == "Creator") {
        let creator = data as Creator
        this.databases = creator.connexions.find(cnx => cnx.id == idConnexion).databases
      }
      else {
        let analyst = data as Analyst
        this.databases = analyst.databases.filter(db => db.connexion.id == idConnexion)
      }

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

    //lel ai
    db.tables.forEach(table => {
      this.tables += table.name +":" + table.id + "|" 
      table.columns.forEach(c => {
        this.columns += c.name +":" + c.id + "|" 
      }
    )
    });
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
  
      // Get aggregations
      const aggregations: Aggregation[] = this.aggregationControls.value;
  
      // Get group by column IDs
      const groupByColumnIds = this.groupByColumns.map(column => column.id);
  
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
          
          errorMessage = `SQL Error: Columns ${missingColumns} must appear in GROUP BY clause or be used in an aggregate function`;
        }
      }
  
      // Rule 2: If using GROUP BY, you should have at least one aggregation function
      if (groupByColumnIds.length > 0 && aggregations.length === 0) {
        console.warn("Warning: Using GROUP BY without any aggregation functions");
        // This is a warning, not an error, so we don't set isValid to false
      }
  
      if (!isValid) {
        alert(errorMessage);
        return;
      }
  
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
        columnId: this.selectedColumns.map(c => c.id),
        groupByColumns: groupByColumnIds,
        aggregations: aggregations,
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

  addTableToWorkspace() {
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


  switch(){
    this.toggle = !this.toggle
  }

  send(s:string){

    console.log(1)

    let prompt = 
  "Tables (IDs): " + this.tables + ".\n" +
  "Columns (IDs): " + this.columns + ".\n" +
  "Convert the following user input into a JSON object representing an SQL query using table and column IDs. Format:\n" +
  "{ id: 1, sentAt: date, sender: {}, tableId: [id], columnId: [id], groupByColumns: [id], aggregations: [{ columnId, function}], joinRequest: { joinConditions: [{firstTableId:,firstColumnName,secondTableId,secondColumnName,joinType=INNER}] }, filters: [{ columnName:string, operator:string, value:string, tableName:string } ]}\n" +
  "Notes : In filter we use column name and table name not id and in join we use Table Id and column name, columnId define the columns of the select, aggregations define the aggregation,every column id present in aggregation can't be present in columnId, tableid define all the table used in the query. every joinCondition define join between two table . Don't give any comments or any explanaition or options just the object i asked for and don't change any key name ever \n" +
  "Important : First step make the query normally than transform it into the object\n"+
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
        const start = reply.indexOf('{');
        const end = reply.lastIndexOf('}');
        const jsonString = reply.slice(start, end + 1);
        console.log(jsonString)

      
        try {
          const parsedObject = JSON.parse(jsonString);
          console.log(parsedObject)
          this.reqservice.fetchTableData(parsedObject).subscribe(data=>{
            this.tableData = data;
            if (this.tableData.length > 0) {
              this.tableHeaders = Object.keys(this.tableData[0]);
            }

          })
          } catch (error) {
          console.error("Failed to parse JSON:", error);
        }

    }
  })
    .catch(err => {
      console.error("Error fetching response:", err);
    });

  }

}
