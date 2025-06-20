import { Component, OnInit, ElementRef, ViewChild, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { DatabaseService } from 'src/app/services/database.service';

interface TableRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface TablePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-database-diagram',
  templateUrl: './database-diagram.component.html',
  styleUrls: ['./database-diagram.component.css']
})
export class DatabaseDiagramComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  
  private ctx: CanvasRenderingContext2D;
  private tableWidth = 280;
  private tableRowHeight = 35;
  private tableHeaderHeight = 45;
  private tableMarginX = 120;
  private tableMarginY = 100;
  private tablePositions: { [tableName: string]: TablePosition } = {};
  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public schema: { relations: TableRelation[]; database: Database }) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const canvasEl = this.canvas.nativeElement;
    this.ctx = canvasEl.getContext('2d');
    this.calculateLayout();
    this.drawDiagram();
  }

  private calculateLayout(): void {
    const tables = this.schema.database.tables;
    const numTables = tables.length;
    const cols = Math.ceil(Math.sqrt(numTables));
    const rows = Math.ceil(numTables / cols);
    this.canvasWidth = cols * (this.tableWidth + this.tableMarginX) + this.tableMarginX;
    this.canvasHeight = rows * (this.getMaxTableHeight() + this.tableMarginY) + this.tableMarginY;
    this.canvas.nativeElement.width = this.canvasWidth;
    this.canvas.nativeElement.height = this.canvasHeight;
    tables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = this.tableMarginX + col * (this.tableWidth + this.tableMarginX);
      const y = this.tableMarginY + row * (this.getTableHeight(table) + this.tableMarginY);
      const height = this.getTableHeight(table);
      
      this.tablePositions[table.name] = {
        x,
        y,
        width: this.tableWidth,
        height
      };
    });
  }

  private getTableHeight(table: DbTable): number {
    return this.tableHeaderHeight + (table.columns.length * this.tableRowHeight);
  }

  private getMaxTableHeight(): number {
    return Math.max(...this.schema.database.tables.map(table => this.getTableHeight(table)));
  }

  private drawDiagram(): void {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.schema.database.tables.forEach(table => {
      this.drawTable(table);
    });
    this.schema.relations.forEach(relation => {
      this.drawRelation(relation);
    });
  }

  private drawTable(table: DbTable): void {
    const pos = this.tablePositions[table.name];
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
    this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
    this.ctx.fillStyle = '#4a90e2';
    this.ctx.fillRect(pos.x, pos.y, pos.width, this.tableHeaderHeight);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y + this.tableHeaderHeight);
    this.ctx.lineTo(pos.x + pos.width, pos.y + this.tableHeaderHeight);
    this.ctx.stroke();
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      table.name,
      pos.x + pos.width / 2,
      pos.y + this.tableHeaderHeight / 2 + 6
    );
    this.ctx.fillStyle = '#333';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    
    table.columns.forEach((column, index) => {
      const columnY = pos.y + this.tableHeaderHeight + (index * this.tableRowHeight) + 18;
      const columnText = `${column.name} (${column.type})`;
      this.ctx.fillText(columnText, pos.x + 8, columnY);
      if (index < table.columns.length - 1) {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y + this.tableHeaderHeight + ((index + 1) * this.tableRowHeight));
        this.ctx.lineTo(pos.x + pos.width, pos.y + this.tableHeaderHeight + ((index + 1) * this.tableRowHeight));
        this.ctx.stroke();
      }
    });
  }

  private drawRelation(relation: TableRelation): void {
    const fromPos = this.tablePositions[relation.fromTable];
    const toPos = this.tablePositions[relation.toTable];
    
    if (!fromPos || !toPos) return;
    const fromPoint = this.getConnectionPoint(fromPos, toPos);
    const toPoint = this.getConnectionPoint(toPos, fromPos);
    const path = this.findPathAroundTables(fromPoint, toPoint, fromPos, toPos);
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }
    
    this.ctx.stroke();
    const lastPoint = path[path.length - 1];
    const secondLastPoint = path[path.length - 2];
    const direction = this.getArrowDirection(secondLastPoint, lastPoint);
    this.drawArrow(lastPoint.x, lastPoint.y, direction);
    const midIndex = Math.floor(path.length / 2);
    const labelPoint = path[midIndex];
    
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(labelPoint.x - 15, labelPoint.y - 8, 30, 16);
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.strokeRect(labelPoint.x - 15, labelPoint.y - 8, 30, 16);
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FK', labelPoint.x, labelPoint.y + 4);
  }

  private getConnectionPoint(fromPos: TablePosition, toPos: TablePosition): { x: number; y: number } {
    const fromCenterX = fromPos.x + fromPos.width / 2;
    const fromCenterY = fromPos.y + fromPos.height / 2;
    const toCenterX = toPos.x + toPos.width / 2;
    const toCenterY = toPos.y + toPos.height / 2;
    const deltaX = toCenterX - fromCenterX;
    const deltaY = toCenterY - fromCenterY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        return { x: fromPos.x + fromPos.width, y: fromCenterY };
      } else {
        return { x: fromPos.x, y: fromCenterY };
      }
    } else {
      if (deltaY > 0) {
        return { x: fromCenterX, y: fromPos.y + fromPos.height };
      } else {
        return { x: fromCenterX, y: fromPos.y };
      }
    }
  }

  private findPathAroundTables(from: { x: number; y: number }, to: { x: number; y: number }, fromTable: TablePosition, toTable: TablePosition): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [from];
    if (this.canDrawDirectPath(from, to, fromTable, toTable)) {
      if (from.x === to.x || from.y === to.y) {
        path.push(to);
      } else {
        const midPoint = this.findSafeMidPoint(from, to);
        path.push(midPoint);
        path.push(to);
      }
    } else {
      const waypoints = this.findWaypointsAroundTables(from, to, fromTable, toTable);
      path.push(...waypoints);
      path.push(to);
    }
    
    return path;
  }

  private canDrawDirectPath(from: { x: number; y: number }, to: { x: number; y: number }, fromTable: TablePosition, toTable: TablePosition): boolean {
    const allTables = Object.values(this.tablePositions);
    
    for (const table of allTables) {
      if (table === fromTable || table === toTable) continue;
      if (this.lineIntersectsRectangle(from, to, table)) {
        return false;
      }
      const midPoint1 = { x: to.x, y: from.y };
      if (this.lineIntersectsRectangle(from, midPoint1, table) || 
          this.lineIntersectsRectangle(midPoint1, to, table)) {
        const midPoint2 = { x: from.x, y: to.y };
        if (this.lineIntersectsRectangle(from, midPoint2, table) || 
            this.lineIntersectsRectangle(midPoint2, to, table)) {
          return false;
        }
      }
    }
    
    return true;
  }

  private findSafeMidPoint(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
    let midPoint = { x: to.x, y: from.y };
    
    if (!this.pointIntersectsAnyTable(midPoint)) {
      return midPoint;
    }
    midPoint = { x: from.x, y: to.y };
    if (!this.pointIntersectsAnyTable(midPoint)) {
      return midPoint;
    }
    return this.findIntermediatePoint(from, to);
  }

  private findWaypointsAroundTables(from: { x: number; y: number }, to: { x: number; y: number }, fromTable: TablePosition, toTable: TablePosition): { x: number; y: number }[] {
    const waypoints: { x: number; y: number }[] = [];
    const obstacles = this.findObstaclesBetween(from, to, fromTable, toTable);
    
    if (obstacles.length === 0) {
      const midPoint = this.findSafeMidPoint(from, to);
      waypoints.push(midPoint);
    } else {
      const routePoints = this.routeAroundObstacles(from, to, obstacles);
      waypoints.push(...routePoints);
    }
    
    return waypoints;
  }

  private findObstaclesBetween(from: { x: number; y: number }, to: { x: number; y: number }, fromTable: TablePosition, toTable: TablePosition): TablePosition[] {
    const obstacles: TablePosition[] = [];
    const allTables = Object.values(this.tablePositions);
    
    for (const table of allTables) {
      if (table === fromTable || table === toTable) continue;
      const minX = Math.min(from.x, to.x) - 50;
      const maxX = Math.max(from.x, to.x) + 50;
      const minY = Math.min(from.y, to.y) - 50;
      const maxY = Math.max(from.y, to.y) + 50;
      
      if (table.x < maxX && table.x + table.width > minX &&
          table.y < maxY && table.y + table.height > minY) {
        obstacles.push(table);
      }
    }
    
    return obstacles;
  }

  private routeAroundObstacles(from: { x: number; y: number }, to: { x: number; y: number }, obstacles: TablePosition[]): { x: number; y: number }[] {
    const waypoints: { x: number; y: number }[] = [];
    if (obstacles.length > 0) {
      const obstacle = obstacles[0];
      const fromCenter = { x: from.x, y: from.y };
      const toCenter = { x: to.x, y: to.y };
      const obstacleCenter = { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 };
      const goAbove = (fromCenter.y + toCenter.y) / 2 < obstacleCenter.y;
      const goLeft = (fromCenter.x + toCenter.x) / 2 < obstacleCenter.x;
      
      if (Math.abs(to.x - from.x) > Math.abs(to.y - from.y)) {
        if (goAbove) {
          waypoints.push({ x: from.x, y: obstacle.y - 20 });
          waypoints.push({ x: to.x, y: obstacle.y - 20 });
        } else {
          waypoints.push({ x: from.x, y: obstacle.y + obstacle.height + 20 });
          waypoints.push({ x: to.x, y: obstacle.y + obstacle.height + 20 });
        }
      } else {
        if (goLeft) {
          waypoints.push({ x: obstacle.x - 20, y: from.y });
          waypoints.push({ x: obstacle.x - 20, y: to.y });
        } else {
          waypoints.push({ x: obstacle.x + obstacle.width + 20, y: from.y });
          waypoints.push({ x: obstacle.x + obstacle.width + 20, y: to.y });
        }
      }
    }
    
    return waypoints;
  }

  private findIntermediatePoint(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const candidates = [
      { x: midX, y: from.y },
      { x: from.x, y: midY },
      { x: to.x, y: midY },
      { x: midX, y: to.y }
    ];
    
    for (const candidate of candidates) {
      if (!this.pointIntersectsAnyTable(candidate)) {
        return candidate;
      }
    }
    return { x: midX, y: midY };
  }

  private lineIntersectsRectangle(point1: { x: number; y: number }, point2: { x: number; y: number }, rect: TablePosition): boolean {
    const padding = 10;
    const left = rect.x - padding;
    const right = rect.x + rect.width + padding;
    const top = rect.y - padding;
    const bottom = rect.y + rect.height + padding;
    return this.lineSegmentIntersectsRect(point1.x, point1.y, point2.x, point2.y, left, top, right, bottom);
  }

  private lineSegmentIntersectsRect(x1: number, y1: number, x2: number, y2: number, left: number, top: number, right: number, bottom: number): boolean {
    if ((x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
        (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)) {
      return true;
    }
    return this.lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||   
           this.lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom) || 
           this.lineIntersectsLine(x1, y1, x2, y2, right, bottom, left, bottom) || // louta 
           this.lineIntersectsLine(x1, y1, x2, y2, left, bottom, left, top);    // ysar
  }

  private lineIntersectsLine(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return false;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  private pointIntersectsAnyTable(point: { x: number; y: number }): boolean {
    const allTables = Object.values(this.tablePositions);
    const padding = 15;
    
    for (const table of allTables) {
      if (point.x >= table.x - padding && 
          point.x <= table.x + table.width + padding &&
          point.y >= table.y - padding && 
          point.y <= table.y + table.height + padding) {
        return true;
      }
    }
    
    return false;
  }

  private getArrowDirection(from: { x: number; y: number }, to: { x: number; y: number }): 'left' | 'right' | 'up' | 'down' {
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private drawArrow(x: number, y: number, direction: 'left' | 'right' | 'up' | 'down'): void {
    const arrowSize = 10;
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    
    switch (direction) {
      case 'right':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - arrowSize, y - arrowSize / 2);
        this.ctx.lineTo(x - arrowSize, y + arrowSize / 2);
        break;
      case 'left':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + arrowSize, y - arrowSize / 2);
        this.ctx.lineTo(x + arrowSize, y + arrowSize / 2);
        break;
      case 'down':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - arrowSize / 2, y - arrowSize);
        this.ctx.lineTo(x + arrowSize / 2, y - arrowSize);
        break;
      case 'up':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - arrowSize / 2, y + arrowSize);
        this.ctx.lineTo(x + arrowSize / 2, y + arrowSize);
        break;
    }
    
    this.ctx.closePath();
    this.ctx.fill();

    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    
    switch (direction) {
      case 'right':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - arrowSize, y - arrowSize / 2);
        this.ctx.lineTo(x - arrowSize, y + arrowSize / 2);
        break;
      case 'left':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + arrowSize, y - arrowSize / 2);
        this.ctx.lineTo(x + arrowSize, y + arrowSize / 2);
        break;
      case 'down':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - arrowSize / 2, y - arrowSize);
        this.ctx.lineTo(x + arrowSize / 2, y - arrowSize);
        break;
      case 'up':
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - arrowSize / 2, y + arrowSize);
        this.ctx.lineTo(x + arrowSize / 2, y + arrowSize);
        break;
    }
    
    this.ctx.closePath();
    this.ctx.fill();
  }
  public refreshDiagram(): void {
    this.calculateLayout();
    this.drawDiagram();
  }

  close(){

  }
}