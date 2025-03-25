import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output } from '@angular/core';
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
    columns: Column[] = [];
    columns2: Column[] = [];
    allColumns: Column[] = [];
    selectedDbIndex: number | null = null;
    
    // Track which columns have been selected
    selectedColumnIds: Set<number> = new Set();
  
    
  
    ngOnInit(): void {
      this.queryForm = this.fb.group({
        table: ['', Validators.required],
        column: ['', Validators.required],
        whereClauses: this.fb.array([])
      });
  
      this.getDbs();
      
      if (this.databases && this.databases.length > 0) {
        this.selectedDbIndex = 0;
        this.toggleDb(this.databases[0]);
      }
    }
  
    // Check if a column is already selected
    isColumnSelected(columnId: number): boolean {
      return this.selectedColumnIds.has(columnId);
    }
  
    // Remove a column from the selected columns
    removeColumn(column: Column): void {
      const index = this.columns.findIndex(c => c.id === column.id);
      if (index !== -1) {
        this.columns.splice(index, 1);
      }
      
      // Remove from selected IDs to re-enable it in the source list
      this.selectedColumnIds.delete(column.id);
      
      // Update form control with selected columns
      this.updateFormColumns();
    }
  
    drop(event: CdkDragDrop<any, any>) {
      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        // Get the column being dragged
        const draggedColumn = event.previousContainer.data[event.previousIndex];
        
        // Check if it's already in the target container to avoid duplicates
        const columnExists = this.columns.some(c => c.id === draggedColumn.id);
        
        if (!columnExists) {
          // Add to selected columns set
          this.selectedColumnIds.add(draggedColumn.id);
          
          // Transfer the item
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          
          // Add back to original container (to keep it there but disabled)
          event.previousContainer.data.splice(event.previousIndex, 0, draggedColumn);
        }
      }
      
      // Update form control with selected columns
      this.updateFormColumns();
    }
    
    updateFormColumns() {
      this.queryForm.patchValue({ column: this.columns.map(c => c.id) });
    }
  
    getDbs() {
      let idConnexion = Number(localStorage.getItem("idConnection"));
      let idUser = Number(localStorage.getItem("userId"));
      
      this.userservice.getUserById(idUser).subscribe(data => {
        this.databases = data.databases.filter(db => db.connexion.id == idConnexion);
      });
    }
  
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
        const whereConditions: WhereClause[] = formData.whereClauses.map((condition: any) => ({
          columnName: condition.columnName,
          operator: condition.operator,
          value: condition.value
        }));
    
        // Constructing request payload
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
          tableId: [this.table.id], // Directly use table ID
          columnId: formData.column,
          groupByColumns: [],
          aggregations: [],
          joinRequest:{
            joinConditions:[]
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
