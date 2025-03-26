import { Component, ElementRef, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js';
import { Graph } from 'src/app/models/graph';
import { Rapport } from 'src/app/models/rapport';
import { RapportService } from 'src/app/services/rapport.service';

@Component({
  selector: 'app-get-rapport',
  templateUrl: './get-rapport.component.html',
  styleUrls: ['./get-rapport.component.css']
})
export class GetRapportComponent implements AfterViewInit {

  constructor(private rapportService: RapportService, private el: ElementRef) { }

  rapport: Rapport;

  show(id: string) {
    this.rapportService.getRapportById(Number(id)).subscribe(data => {
      this.rapport = data;

      if (this.rapport && this.rapport.graphs) {
        this.rapport.graphs.forEach(table => {
          if (table.format == "chart")
            setTimeout(() => this.createChart(table), 0);
        });
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

  ngAfterViewInit() {
    if (this.rapport && this.rapport.graphs) {
      this.rapport.graphs.forEach(table => {
        this.createChart(table);
      });
    }
  }
}
