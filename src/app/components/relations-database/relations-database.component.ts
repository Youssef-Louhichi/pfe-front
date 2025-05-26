import { Component, OnInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import * as d3 from 'd3';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface TableRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

@Component({
  selector: 'app-relations-database',
  templateUrl: './relations-database.component.html',
  styleUrls: ['./relations-database.component.css']
})
export class RelationsDatabaseComponent implements OnInit {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;


  constructor(private dialogRef: MatDialogRef<RelationsDatabaseComponent>,
      @Inject(MAT_DIALOG_DATA) private schema: TableRelation[]) {}

  ngOnInit(): void {
 
        setTimeout(() => this.createStaticDiagram(), 0);
      
  }

 private createStaticDiagram(): void {
    const container = this.graphContainer.nativeElement;
    const width = container.offsetWidth;
    const height = Math.max(600, this.schema.length * 100 + 100); // Increased spacing

    // Clear previous diagram
    d3.select(container).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(container).append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create a group for the diagram
    const diagram = svg.append('g')
      .attr('transform', `translate(50, 50)`);

    // Add title
    diagram.append('text')
      .attr('x', width / 2 - 100)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Database Schema Relationships');

    // Create relationships
    this.schema.forEach((relation, i) => {
      const y = 50 + i * 100;
      const fromX = 50;
      const toX = width - 200;
      const lineY = y + 50; // Position for the connection line between tables
      const columnsY = y + 20; // Position for the column names above the line
      
      // From table
      diagram.append('rect')
        .attr('x', fromX)
        .attr('y', y + 30)
        .attr('width', 150)
        .attr('height', 40)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#e3f2fd')
        .attr('stroke', '#1976d2');

      diagram.append('text')
        .attr('x', fromX + 75)
        .attr('y', y + 55)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#0d47a1')
        .text(relation.fromTable);

      // To table
      diagram.append('rect')
        .attr('x', toX)
        .attr('y', y + 30)
        .attr('width', 150)
        .attr('height', 40)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#e8f5e9')
        .attr('stroke', '#388e3c');

      diagram.append('text')
        .attr('x', toX + 75)
        .attr('y', y + 55)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#1b5e20')
        .text(relation.toTable);

      // Main connection line between tables (solid)
      diagram.append('line')
        .attr('x1', fromX + 150)
        .attr('y1', lineY)
        .attr('x2', toX)
        .attr('y2', lineY)
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5);

      // Column names and arrow (positioned above the connection line)
      const lineMiddle = (fromX + 150 + toX) / 2;
      
      // From column
      diagram.append('text')
        .attr('x', lineMiddle - 50)
        .attr('y', columnsY)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#555')
        .text(relation.fromColumn);

      // Arrow between columns
      diagram.append('line')
        .attr('x1', lineMiddle - 40)
        .attr('y1', columnsY + 5)
        .attr('x2', lineMiddle + 40)
        .attr('y2', columnsY + 5)
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrowhead)');

      // To column
      diagram.append('text')
        .attr('x', lineMiddle + 50)
        .attr('y', columnsY)
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('fill', '#555')
        .text(relation.toColumn);
    });

    // Add arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#666');
  }

  closePopUp(){
    this.dialogRef.close()
  }
}


