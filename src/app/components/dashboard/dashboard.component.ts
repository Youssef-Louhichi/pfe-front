import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Column } from 'src/app/models/column';
import { Database } from 'src/app/models/database';
import { DbTable } from 'src/app/models/db-table';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { RequeteService } from 'src/app/services/requete.service';
import { UsersService } from 'src/app/services/users.service';


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
  result: any[] 

  ngOnInit(): void {

    this.queryForm = this.fb.group({
      table: ['', Validators.required],
      column: ['', Validators.required],
      whereClauses: this.fb.array([])
    })

    this.getDbs()
    

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
    this.queryForm.get("table").setValue(t.name)
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
        columnId: [formData.column], 
        groupByColumns: [],
        aggregations: [],
        filters: whereConditions
      };
      console.log("Sending request payload:", JSON.stringify(requestPayload, null, 2));

      this.reqservice.fetchTableData(requestPayload).subscribe(
        response => this.result = response,
        error => console.error('Error fetching data:', error)
      );
    }
  }




 


}
