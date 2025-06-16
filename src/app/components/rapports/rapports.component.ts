import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { Graph } from 'src/app/models/graph';
import { Rapport } from 'src/app/models/rapport';
import { Script } from 'src/app/models/script';
import { ScriptServiceService } from 'src/app/services/script-service.service';
import { UsersService } from 'src/app/services/users.service';
import { ScriptdetailsComponent } from '../scriptdetails/scriptdetails.component';
import { User } from 'src/app/models/user';
import { RapportService } from 'src/app/services/rapport.service';
import { DatabaseService } from 'src/app/services/database.service';


interface Slide {
  title: string;
  description: string;
  stats: {
    queries: number;
    reports: number;
    scripts: number;
  };
}

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit, OnDestroy {

  showCreateScriptPopup: boolean = false;
  slides: Slide[] = [
    {
      title: 'Database Overview',
      description: 'Get a quick overview of your database usage and activity',
      stats: {
        queries: 0,
        reports: 0,
        scripts: 0
      }
    },
    {
      title: 'Storage Statistics',
      description: 'Monitor your database storage and resource utilization',
      stats: {
        queries: 0,
        reports: 0,
        scripts: 0
      }
    }
  ];
  currentSlide: number = 0;
  slideInterval: any;
dashboardData: any[] = [];
  rapports:Rapport[]
  scripts: any[];
  user:User


  constructor(private userService:UsersService, private router:Router,
    private el: ElementRef, private scriptservice: ScriptServiceService, private dialog: MatDialog, private rapportservice : RapportService,
  private databaseService: DatabaseService) { }

  ngOnInit(): void {
    this.userService.getUserById(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.user = data
    });
    
    this.userService.getUserRapports(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.rapports = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      this.rapports = this.rapports.filter(r => r.cnxrapport.id == Number(localStorage.getItem("idConnection")));
      this.rapports.forEach(rapport => {
        rapport.graphs.forEach(table => {
          if (table.format == "chart")
            setTimeout(() => this.createChart(table), 0);
        });
      });
      this.updateSlidesData();
    });
    
    this.getScripts();
        
     const creatorId = Number(localStorage.getItem('userId'));  
    const cnxId = Number(localStorage.getItem('idConnection'));

    this.databaseService.getDashboardForUser(creatorId, cnxId).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.updateSlidesData();
      },
      error: (err) => {
        console.error('Error fetching dashboard:', err);
      }
    });

    this.startSlideshow();
  }
  
  ngOnDestroy(): void {
    
    this.stopSlideshow();
  }
  startSlideshow(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 3000); 
  }
  
  stopSlideshow(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
  
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }
  
  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }
  
  goToSlide(index: number): void {
    this.currentSlide = index;
  }

deleteRapport(id: number) {
  console.log(id);
  this.rapportservice.deleteRapport(id).subscribe({
    next: () => {
      console.log('Deleted successfully');
      this.rapports = this.rapports.filter(rapport => rapport.id !== id);
    },
    error: (err) => {
      console.error('Delete failed:', err);
    }
  });
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
              display: false 
            },
            y: {
              display: false 
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

  getScripts() {
    this.scriptservice.getByUser(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.scripts = data 
      console.log(this.scripts.length)
    })
  }

  openScript(scriptId: number): void {
    this.router.navigate(['/main/dashboard/edit/', scriptId]);
  }

  deleteScript(id : number) : void {
    this.scriptservice.deleteScript(id).subscribe({
      next: () => {
        console.log('Script deleted');
      this.scripts = this.scripts.filter(script => script.id !== id);
      }
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

  goToStats(){
    this.router.navigate(["/main/dashboard/statistics"])
  }




  getTotalQueryCount(): number {
    return this.dashboardData.reduce((sum, db) => sum + db.queryCount, 0);
  }

  getTotalTables(): number {
    return this.dashboardData.reduce((sum, db) => sum + db.tableCount, 0);
  }

  getTotalSize(): number {
    return this.dashboardData.reduce((sum, db) => sum + (db.usedSizeBytes || 0), 0);
  }

  private updateSlidesData(): void {
    if (this.slides && this.slides.length >= 2) {
      this.slides[0].stats = {
        queries: this.getTotalQueryCount(),
        reports: this.rapports?.length || 0,
        scripts: this.scripts?.length || 0
      };
      this.slides[1].stats = {
        queries: this.getTotalTables(),
        reports: Math.round(this.getTotalSize() / (1024 * 1024)), 
        scripts: this.dashboardData?.length || 0
      };
    }
  }
}