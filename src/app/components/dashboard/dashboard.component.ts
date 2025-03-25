import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Column } from 'src/app/models/column';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { Chart, registerables } from 'chart.js'
import { Graph } from 'src/app/models/graph';
import { Rapport } from 'src/app/models/rapport';
Chart.register(...registerables)

interface WhereClause {
  columnName: string;
  operator: string;
  value: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private userservice: UsersService, private fb: FormBuilder, private reqservice: RequeteService,
    private cdRef: ChangeDetectorRef, private el: ElementRef
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
        tableId: this.table.id, // Directly use table ID
        columnId: formData.column,
        groupByColumns: [],
        aggregations: [],
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


  rapportTables: Graph[] =  [
    new Graph(
        1,
        ['Month', 'price'],
        [
         { Month: "January",price: 65},{ Month : "February",price: 20}
       ],
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
    )
   ];

   onDataAdded(newItem:Graph) {
    this.rapportTables.push(newItem);
    console.log(this.rapportTables)
  }


  draggingTable: any = null;
  resizingTable: any = null;
  offsetX = 0;
  offsetY = 0;
  
  @ViewChild('page')pageRef!: ElementRef;

  startDrag(event: MouseEvent, table: Graph, page: HTMLElement): void {
    this.draggingTable = table;
    this.offsetX = event.clientX - table.leftpos;
    this.offsetY = event.clientY - table.toppos;

    document.addEventListener('mousemove', this.dragTable);
    document.addEventListener('mouseup', this.stopDrag);
  }

  dragTable = (event: MouseEvent): void => {
    if (this.draggingTable) {
      const workspaceBounds = this.pageRef.nativeElement.getBoundingClientRect();
      const newLeft = Math.max(0, Math.min(event.clientX - this.offsetX, workspaceBounds.width - this.draggingTable.width));
      const newTop = Math.max(0, Math.min(event.clientY - this.offsetY, workspaceBounds.height - this.draggingTable.height));

      this.draggingTable.leftpos = newLeft;
      this.draggingTable.toppos = newTop;
    }
  };

  stopDrag = (): void => {
    this.draggingTable = null;
    document.removeEventListener('mousemove', this.dragTable);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  startResize(event: MouseEvent, table: Graph): void {
    this.resizingTable = {
      ref: table,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: table.width,
      startHeight: table.height
    };
  
    document.addEventListener('mousemove', this.resizeTable);
    document.addEventListener('mouseup', this.stopResize);
    event.stopPropagation();
    event.preventDefault();
  }
  

  resizeTable = (event: MouseEvent): void => {
    if (this.resizingTable) {
      event.preventDefault();
  
      const { ref, startX, startY, startWidth, startHeight } = this.resizingTable;
      const workspaceBounds = this.pageRef.nativeElement.getBoundingClientRect();
  
      let newWidth = startWidth + (event.clientX - startX);
      let newHeight = startHeight + (event.clientY - startY);
  
      newWidth = Math.min(newWidth, workspaceBounds.width - ref.leftpos);
      newHeight = Math.min(newHeight, workspaceBounds.height - ref.toppos);
  
      ref.width = Math.max(10, newWidth);
      ref.height = Math.max(10, newHeight);
    }
  };
  
  

  stopResize = (): void => {
    this.resizingTable = null;
    document.removeEventListener('mousemove', this.resizeTable);
    document.removeEventListener('mouseup', this.stopResize);
  };



changeFormat(table:Graph){
  table.format = table.format === 'table' ? 'chart' : 'table';
  if (table.format === 'chart') {
    setTimeout(() => this.createChart(table), 0);  }


}

charts: { [key: string]: Chart } = {};

createChart(table: Graph): void {

  const canvas = this.el.nativeElement.querySelector(`#chartCanvas-${table.id}`);

 


  if (canvas && table.headers.length >1 ) {
    


    if(!table.columnX || !table.columnY){
      table.columnX = table.headers[0]
      table.columnY = table.headers[1]

    }

   

    
    
    let tabX = table.data.map(row => row[table.columnX]); 
    let tabY = table.data.map(row => row[table.columnY]); 


    if(!table.chartType)
      table.chartType = "bar"

    if (!table.colors) {
      table.colors = tabY.map(() => '#004B91'); 
    }

    if (this.charts[table.id]) {
      this.charts[table.id].destroy();
    }

    console.log(table)

    this.charts[table.id] = new Chart(`chartCanvas-${table.id}`, {
    type: table.chartType,
    data: {
      labels: tabX,
      datasets: [
        {
          label: 'Dataset',
          data: tabY, 
          backgroundColor: table.colors,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
}

selectedX: string = '';
  selectedY: string = '';
  selectedTable:any 
  selectedColors: string[] = []
  selectedChartType: string = ""

useTools(table:any){
  console.log(table)
  if(table.format=="chart"){
    this.selectedX = table.columnX
    this.selectedY = table.columnY
    this.selectedTable=table
    if (!this.selectedTable.colors) {
      this.selectedTable.colors = this.selectedTable.data.map(() => '#004B91')
    }    
    this.selectedColors = [...this.selectedTable.colors]
    this.selectedChartType=table.chartType
  }
}

switchAxes(){
 let aux = this.selectedTable.columnX
 this.selectedTable.columnX = this.selectedTable.columnY
 this.selectedTable.columnY = aux

 this.selectedX = this.selectedTable.columnX
 this.selectedY = this.selectedTable.columnY

 this.createChart(this.selectedTable)
}

updateChartColors() {
  this.selectedTable.colors = [...this.selectedColors]
  this.updateChart();
}

updateChart() {
  if (this.charts[this.selectedTable.id]) {
    this.selectedTable.colors = this.selectedColors
    this.selectedTable.chartType = this.selectedChartType
    this.createChart(this.selectedTable)
  }

}



show(){
}
  
}