import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-dbs-statistics',
  templateUrl: './dbs-statistics.component.html',
  styleUrls: ['./dbs-statistics.component.css']
})
export class DbsStatisticsComponent  implements OnInit {
  dashboardData: any[] = [];
  Object = Object; 

  constructor(private databaseService: DatabaseService,private router: Router) {}

  ngOnInit(): void {
    const creatorId = Number(localStorage.getItem('userId'));  
    const cnxId = Number(localStorage.getItem('idConnection'));

    this.databaseService.getDashboardForUser(creatorId, cnxId).subscribe({
      next: (data) => {
        this.dashboardData = data;
      },
      error: (err) => {
        console.error('Error fetching dashboard:', err);
      }
    });
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

  getRecentMonths(stats: any): string[] {
    if (!stats) return [];
    return Object.keys(stats).slice(0, 6); // Show last 6 months
  }

  getBarHeight(queryCount: number): string {
    const maxHeight = 100; // pixels
    const maxQueries = Math.max(...Object.values(this.dashboardData
      .flatMap(db => Object.values(db.monthlyQueryStats || {})) as number[]), 1);
    return `${(queryCount / maxQueries) * maxHeight}px`;
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }



navigateToDashboard() {
  this.router.navigate(['/main/dashboard']);
}
}