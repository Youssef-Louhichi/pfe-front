import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { Graph } from 'src/app/models/graph';
import { Rapport } from 'src/app/models/rapport';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit{


    constructor(private userService:UsersService,private router:Router,
      private el: ElementRef
    ) { }

    rapports:Rapport[]

    ngOnInit(): void {
      this.userService.getUserRapports(Number(localStorage.getItem("userId"))).subscribe(data =>{
        this.rapports = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        this.rapports.forEach(rapport =>{
          rapport.graphs.forEach(table => {
            if (table.format == "chart")
              setTimeout(() => this.createChart(table), 0);
          });
        })
      })

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
}
