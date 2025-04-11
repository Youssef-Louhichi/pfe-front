import { Component, Input } from '@angular/core';
import { Analyst } from 'src/app/models/analyst';
import { User } from 'src/app/models/user';
import { UserDetailsPopupComponent } from '../user-details-popup/user-details-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { Database } from 'src/app/models/database';
import { AnalystService } from 'src/app/services/analyst.service';

@Component({
  selector: 'app-list-user',
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.css']
})
export class ListUserComponent {


constructor(
    private dialog: MatDialog,
  private analystservice: AnalystService,
  ) { }
isDatabaseSelected: boolean = false;
selectedTables: Set<string> = new Set(); // Track selected table names

selectedDbId: number | null = null;
selectedTableIds: number[] = [];
selectedColumnIds: number[] = [];


  @Input() analysts : Analyst[]
    @Input() selectedDb: Database
  




    isTableDisabled(): boolean {
      return this.selectedDbId !== null;
    }
    
    isColumnDisabled(tableId: number): boolean {
      return this.selectedDbId !== null || this.selectedTableIds.includes(tableId);
    }
    
    onDatabaseCheckboxChange(event: any, db: Database) {
      const isChecked = event.target.checked;
      this.selectedDbId = isChecked ? db.id : null;
      
      if (isChecked) {
        this.selectedTableIds = [];
        this.selectedColumnIds = [];
      }
    }
    
    onTableCheckboxChange(event: any, table: any) {
      const isChecked = event.target.checked;
      
      if (isChecked) {
        this.selectedDbId = null; // Unselect database if selecting table
        this.selectedTableIds = [...this.selectedTableIds, table.id];
        // Remove any columns from this table
        this.selectedColumnIds = this.selectedColumnIds.filter(colId => 
          !table.columns.some((col: any) => col.id === colId)
        );
      } else {
        this.selectedTableIds = this.selectedTableIds.filter(id => id !== table.id);
      }
    }
    
    onColumnCheckboxChange(event: any, column: any) {
      const isChecked = event.target.checked;
      
      if (isChecked) {
        this.selectedColumnIds = [...this.selectedColumnIds, column.id];
        // Make sure parent table isn't selected
        this.selectedTableIds = this.selectedTableIds.filter(id => id !== column.tableId);
        this.selectedDbId = null; // Unselect database if selecting column
      } else {
        this.selectedColumnIds = this.selectedColumnIds.filter(id => id !== column.id);
      }
    }
    getSelectedIds() {
      console.log({
        databaseId: this.selectedDbId,
        tableIds: this.selectedTableIds,
        columnIds: this.selectedColumnIds
      })
    }
  showUserDetails(user: User): void {
    this.dialog.open(UserDetailsPopupComponent, {
        width: '420px',
        panelClass: 'user-details-dialog',
        data: user,
        autoFocus: false,
        disableClose: false
    });
}


selectedAnalystId: Analyst  = null; 
selectedAnalystRelations: any[] = []; // Array of relations for the selected analyst

toggleCheck(analystId: Analyst) {
  if (this.selectedAnalystId === analystId) {
    this.selectedAnalystId = null;
    this.selectedAnalystRelations = [];
    this.clearAllSelections();
  } else {
    this.selectedAnalystId = analystId;
    this.loadAnalystRelations(analystId);
  }
}

loadAnalystRelations(analystId: Analyst) {
  this.clearAllSelections();

  this.selectedAnalystRelations = this.getRelationsForAnalyst(analystId);


  this.selectedAnalystRelations.forEach(relation => {
    if (relation.relationDatabase) {
      this.selectedDbId = relation.relationDatabase.database.id;
    } else if (relation.relationTable) {
      if (!this.selectedTableIds.includes(relation.relationTable.table.id)) {
        this.selectedTableIds.push(relation.relationTable.table.id);
      }
    } else if (relation.relationColumn) {
      if (!this.selectedColumnIds.includes(relation.relationColumn.column.id)) {
        this.selectedColumnIds.push(relation.relationColumn.column.id);
      }
    }
  });

}
getRelationsForAnalyst(analyst: Analyst): any[] {
  if (!analyst?.relations) {
    return [];
  }

  return analyst.relations.map(relation => {
    if (relation.database != null) {
      return { relationDatabase: { database: relation.database } };
    }
    else if (relation.table != null) {
      return { relationTable: { table: relation.table } };
    }
    else if (relation.column != null) {
      return { relationColumn: { column: relation.column } };
    }
    return null; 
  }).filter(relation => relation !== null)


}

clearAllSelections() {
  this.selectedDbId = null;
  this.selectedTableIds = [];
  this.selectedColumnIds = [];
}



updateUser(user: Analyst) {
  let payload = {
    databaseId: this.selectedDbId,
    tablesIds: this.selectedTableIds,
    columnsIds: this.selectedColumnIds
  }
  if(payload.databaseId != null || payload.tablesIds.length != 0 || payload.columnsIds.length != 0){
  this.analystservice.deleteAnalystRelation(user.identif).subscribe(bool =>{
    if(bool){
      this.analystservice.linkDatabaseToAnalyst(user.identif, payload).subscribe(data => {
        if (data.message == "Database linked successfully") {
          this.selectedAnalystId=null
          this.selectedDbId = null
          this.selectedTableIds = []
          this.selectedColumnIds = []
        }
      })
    }
  })
}
}

}
