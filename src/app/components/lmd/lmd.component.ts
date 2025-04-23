import { Component, OnInit } from '@angular/core';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { Column } from 'src/app/models/column';
import { UsersService } from 'src/app/services/users.service';
import { AnalystService } from 'src/app/services/analyst.service';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { RequeteService } from 'src/app/services/requete.service';
import { Analyst } from 'src/app/models/analyst';
import { Creator } from 'src/app/models/creator';

interface InsertPayload {
  tableId: number;
  columnValues: { [key: string]: any };
}

interface UpdatePayload {
  tableId: number;
  columnValues: { [key: string]: any };
  filters: any[];
  joins?: any[];
}

interface DeletePayload {
  tableId: number;
  filters: any[];
  joins?: any[];
}

@Component({
  selector: 'app-lmd',
  templateUrl: './lmd.component.html',
  styleUrls: ['./lmd.component.css']
})
export class LMDComponent implements OnInit {
  databases: Database[] = [];
  selectedDbIndex: number | null = null;
  selectedTable: DbTable | null = null;
  tableColumns: Column[] = [];
  showColumns: { [key: string]: boolean } = {};
  showDatabases: { [key: string]: boolean } = {};
  formMode: 'insert' | 'update' | 'delete' | null = null;
  availableTables: DbTable[] = [];

  constructor(
    private userService: UsersService,
    private analystService: AnalystService,
    private connexionService: ConnexionsService,
    private reqService: RequeteService
  ) {}

  ngOnInit(): void {
    this.getDatabases();
    
  }

  getDatabases(): void {
    const idConnection = Number(localStorage.getItem('idConnection'));
    const idUser = Number(localStorage.getItem('userId'));

    this.userService.getUserById(idUser).subscribe(data => {
      if (data.type === 'Creator') {
        this.connexionService.getConnexionDatabases(idConnection).subscribe(d => {
          this.databases = d;
          if (d.length > 0) {
            this.selectedDbIndex = 0;
            this.toggleDb(d[0]);
          }
        });
      } else {
        this.analystService.getAnalystsDatabasess(idUser).subscribe(d => {
          this.databases = d;
          if (d.length > 0) {
            this.selectedDbIndex = 0;
            this.toggleDb(d[0]);
          }
        });
      }
    });
  }

  toggleDb(db: Database): void {
    const index = this.databases.findIndex(database => database.name === db.name);
    if (index !== -1) {
      this.selectedDbIndex = index;
      this.availableTables = this.databases[index].tables || [];
    }
    this.showDatabases = { [db.name]: true };
    this.selectedTable = null;
    this.tableColumns = [];
    this.formMode = null;
  }

  toggleTable(table: DbTable): void {
    this.showColumns[table.name] = !this.showColumns[table.name];
  }

  selectTable(table: DbTable, mode: 'insert' | 'update' | 'delete'): void {
    this.selectedTable = table;
    this.tableColumns = [...table.columns];
    this.formMode = mode;
  }

  resetForm(): void {
    this.selectedTable = null;
    this.tableColumns = [];
    this.formMode = null;
  }

  onInsertSubmit(payload: InsertPayload): void {
    this.reqService.insertTableData(payload).subscribe(
      response => {
        console.log('Insert successful:', response);
        alert('Data inserted successfully!');
        this.resetForm();
      },
      error => {
        console.error('Error inserting data:', error);
        alert('Error inserting data.');
      }
    );
  }

  onUpdateSubmit(payload: UpdatePayload): void {
    if (Object.keys(payload.columnValues).length === 0) {
      alert('Please specify at least one column value to update');
      return;
    }
    this.reqService.UpdateTableData(payload).subscribe(
      response => {
        console.log('Update successful:', response);
        alert('Data updated successfully!');
        this.resetForm();
      },
      error => {
        console.error('Error updating data:', error);
        alert('Error updating data.');
      }
    );
  }

  onDeleteSubmit(payload: DeletePayload): void {
    if (payload.filters.length === 0) {
      alert('Please specify at least one condition for deletion');
      return;
    }
    if (confirm('Are you sure you want to delete these records? This action cannot be undone.')) {
      this.reqService.DeleteTableData(payload).subscribe(
        response => {
          console.log('Delete successful:', response);
          alert('Data deleted successfully!');
          this.resetForm();
        },
        error => {
          console.error('Error deleting data:', error);
          alert('Error deleting data.');
        }
      );
    }
  }
}