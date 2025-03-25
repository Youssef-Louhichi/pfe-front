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
export class DashboardComponent  {

  constructor( private el: ElementRef
  ) { }

  


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