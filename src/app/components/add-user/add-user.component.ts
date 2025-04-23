import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Analyst } from 'src/app/models/analyst';
import { Database } from 'src/app/models/database';
import { User } from 'src/app/models/user';
import { AnalystService } from 'src/app/services/analyst.service';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

    @Input() user: User;
  useradd: User;
  dbs: Database[] = []
  @Input() selectedDb: Database
  newUserform: FormGroup
  @Input() analysts : Analyst[]

  constructor(private userservice: UsersService, private analystservice: AnalystService, private fb: FormBuilder
  ) { }
  ngOnInit(): void {
    this.newUserform = this.fb.group({
      mail: [,Validators.required],
      password: [,Validators.required],
      databases: [[]],
      rapports: [[]]
    })
  }


  isDatabaseSelected: boolean = false;
selectedTables: Set<string> = new Set(); 

selectedDbId: number | null = null;
selectedTableIds: number[] = [];
selectedColumnIds: number[] = [];

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

  isExistingUser: boolean = true

  toggleForm() {
    this.isExistingUser = !this.isExistingUser;
  }





  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userservice.deleteUser(id).subscribe(() => {
      });
    }
  }



  filteredUsers: User[] = [];

  filterUsers(mail: string) {
    if (this.isEmailComplete(mail)) {
      this.userservice.getUserByMail(mail).subscribe(data => {
        if (data[0])
          this.filteredUsers = data
      })
    }
    else {
      this.filteredUsers = [];
    }
  }

  isEmailComplete(mail: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(mail);
  }


  addUser() {

    let payload = {
      databaseId: this.selectedDbId,
      tablesIds: this.selectedTableIds,
      columnsIds: this.selectedColumnIds
    }

    if(payload.databaseId != null || payload.tablesIds.length != 0 || payload.columnsIds.length != 0){


    if (this.filteredUsers.length != 0) {
      if (this.analysts.filter(u => u.identif == this.filteredUsers[0].identif).length == 0)
      
        this.analystservice.linkDatabaseToAnalyst(this.filteredUsers[0].identif, payload).subscribe(data => {
          if (data.message == "Database linked successfully") {
            this.analysts.push(data.analyst)
            this.filteredUsers = []
            this.selectedDbId = null
          this.selectedTableIds = []
          this.selectedColumnIds = []
          }
        })
    }
  }

  }


  generatePwd() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newUserform.get("password").setValue(password)

  }
  addNewUser() {

    let payload = {
      databaseId: this.selectedDbId,
      tablesIds: this.selectedTableIds,
      columnsIds: this.selectedColumnIds
    }

    if(payload.databaseId != null || payload.tablesIds.length != 0 || payload.columnsIds.length != 0){


    this.analystservice.createAnalyst(this.newUserform.value).subscribe(data => {
      this.analystservice.linkDatabaseToAnalyst(data.identif, payload).subscribe(data2 => {
        if (data2.message == "Database linked successfully") {
          this.analysts.push(data2.analyst as Analyst)
          this.newUserform.reset()
          this.selectedDbId = null
          this.selectedTableIds = []
          this.selectedColumnIds = []
        }
      })
    })
  }
}

}
