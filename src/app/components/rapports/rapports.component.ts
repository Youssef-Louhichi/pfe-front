import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { Graph } from 'src/app/models/graph';
import { Rapport } from 'src/app/models/rapport';
import { Script } from 'src/app/models/script';
import { ScriptServiceService } from 'src/app/services/script-service.service';
import { UsersService } from 'src/app/services/users.service';
import { ScriptdetailsComponent } from '../scriptdetails/scriptdetails.component';

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit{
  showCreateScriptPopup: boolean = false;

    constructor(private userService:UsersService,private router:Router,
      private el: ElementRef,private scriptservice : ScriptServiceService,private dialog: MatDialog
    ) { }

    rapports:Rapport[]
    scripts: any[];

    ngOnInit(): void {
      this.userService.getUserRapports(Number(localStorage.getItem("userId"))).subscribe(data =>{
        this.rapports = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        this.rapports = this.rapports.filter(r => r.cnxrapport.id == Number(localStorage.getItem("idConnection")))
        this.rapports.forEach(rapport =>{
          rapport.graphs.forEach(table => {
            if (table.format == "chart")
              setTimeout(() => this.createChart(table), 0);
          });
        })
      })
this.getScripts();
    }

    
    
      charts: { [key: string]: Chart } = {};
    
      createChart(table: Graph): void {
        const canvas = this.el.nativeElement.querySelector(`#chartCanvas-${table.id}`);
    
        if (canvas && table.headers.length > 1) {
          if (!table.columnX || !table.columnY) {
            table.columnX = table.headers[0];
            table.columnY = table.headers[1];
          }
    
          let tabX = table.data.map(row => row[table.columnX]);
          let tabY = table.data.map(row => row[table.columnY]);
    
          if (!table.chartType) table.chartType = 'bar';
    
          if (!table.colors) {
            table.colors = tabY.map(() => '#004B91');
          }
    
          if (this.charts[table.id]) {
            this.charts[table.id].destroy();
          }
    
          this.charts[table.id] = new Chart(`chartCanvas-${table.id}`, {
            type: table.chartType,
            data: {
              labels: tabX,
              datasets: [
                {
                  label: 'Dataset',
                  data: tabY,
                  backgroundColor: table.colors,
                  borderWidth: 0.2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  display: false // Hide the x-axis if needed
                },
                y: {
                  display: false // Hide the y-axis if needed
                }
              
              },

              plugins: {
                legend: {
                  display: false 
                }
              }
             
            }
            
          });
        }
      }
    
     

    openRapport(rapport:Rapport){
      localStorage.setItem('rapport', JSON.stringify(rapport))
      this.router.navigate(["/main/dashboard/edit"])
    }

    openNewRapport(){
      localStorage.setItem('rapport', JSON.stringify(new Rapport(null, null, [], null, null,null,null)))
      this.router.navigate(["/main/dashboard/edit"])
    }


    editRapport(r:Rapport){
      
    }



getScripts()
{
  this.scriptservice.getByUser(Number(localStorage.getItem("userId"))).subscribe(data => {
    this.scripts = data 
    console.log(this.scripts.length)
  })
}

openScript(scriptId: number): void {
  this.router.navigate(['/main/dashboard/edit/', scriptId]);
}

deleteScript(id : number) : void 
{
  this.scriptservice.deleteScript(id).subscribe({
    next: () => console.log('Script deleted'),
  });

}


openCreateScriptPopup() {
  this.showCreateScriptPopup = true;
}

closeCreateScriptPopup() {
  this.showCreateScriptPopup = false;
}

onScriptCreated(newScript: Script) {
  this.scripts.push(newScript);
  this.closeCreateScriptPopup();
}



openScriptSelectionDialog(scriptId: number): void {

  const selectedScripts: number[] = [];
  selectedScripts.push(scriptId);
  const dialogRef = this.dialog.open(ScriptdetailsComponent, {
    width: '400px',
    data: { scriptId }
    
  });
  dialogRef.afterClosed().subscribe((removedRequetes: number[] | undefined) => {
    if (removedRequetes && removedRequetes.length > 0) {
      removedRequetes.forEach((requeteId) => {
        this.scriptservice.removeRequeteFromScripts(selectedScripts, requeteId)
          .subscribe({
            next: () => console.log(`Requête ${requeteId} removed from script ${scriptId}`),
            error: (err) => console.error(`Failed to remove requête ${requeteId}:`, err)
          });
      });
    }
  });

}
}