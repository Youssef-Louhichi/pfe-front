import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Column } from 'src/app/models/column';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem,CdkDropList  } from '@angular/cdk/drag-drop';


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
  export class DashboardComponent implements OnInit{

    constructor(private userservice:UsersService,private fb: FormBuilder,private reqservice : RequeteService){} 


    databases:Database[]
    queryForm: FormGroup;
    showDatabases: {[key: string]: boolean} = {}
    http: any;
    table:DbTable = null
    tableData: any[] = [];
    tableHeaders: string[] = [];
    columns : Column[] = [];
    columns2 : Column[] = [];
    allColumns: Column[]=[];
    ngOnInit(): void {

      this.queryForm = this.fb.group({
        table: ['', Validators.required],
        column: ['', Validators.required],
        whereClauses: this.fb.array([])
      })

      this.getDbs()
      


    }
    drop(event: CdkDragDrop<any>) {

      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
  this.columns2.push()
      // Update form control with selected columns
      this.queryForm.patchValue({ column: this.columns.map(c => c.id)  });
      
    }

    getDbs(){
      let idConnexion = Number(localStorage.getItem("idConnection"))
      let idUser = Number(localStorage.getItem("userId"))
      
      this.userservice.getUserById(idUser).subscribe(data => {
        this.databases = data.databases.filter(db => db.connexion.id == idConnexion)
      })
    }

    get whereClauses(): FormArray {
      return this.queryForm.get('whereClauses') as FormArray;
    }

    addWhereCondition() {
      const whereCondition = this.fb.group({
        columnName: ['', Validators.required],
        operator: ['=', Validators.required],
        value: ['', Validators.required]
      });
      this.whereClauses.push(whereCondition);
    }

    removeWhereCondition(index: number) {
      this.whereClauses.removeAt(index);
    }

    toggleDb(db: Database) {
      this.showDatabases[db.name] = !this.showDatabases[db.name]
    }

    useTable(t:DbTable){
      this.table = t
      this.queryForm.get("table").setValue(t.name);
      this.columns2 = t.columns
      this.allColumns = [...t.columns];
     
    }

    onSubmit() {
      if (this.queryForm.valid) {
        const formData = this.queryForm.value;
        const whereConditions: WhereClause[] = formData.whereClauses.map((condition: any) => ({
          columnName: condition.columnName,
          operator: condition.operator,
          value: condition.value}));

        // Constructing request payload
        const requestPayload = {
          req: {
            id: 1,
            sentAt: new Date().toISOString(),
            sender: {
              identif: 1,
              mail: "test@example.com",
              password: "1234"
            },
            content: "Fetching data"
          },
          tableId: this.table.id,
          columnId: formData.column,
          groupByColumns: [],
          aggregations: [],
          filters: whereConditions
        };
        console.log("Sending request payload:", JSON.stringify(requestPayload, null, 2));

        this.reqservice.fetchTableData(requestPayload).subscribe(
          response => {
            this.tableData = response
            console.log(response)
            if (this.tableData.length > 0) {
              this.tableHeaders = Object.keys(this.tableData[0]);
            }
          },
          error => console.error('Error fetching data:', error)
        );
      }
    }




  


  }
