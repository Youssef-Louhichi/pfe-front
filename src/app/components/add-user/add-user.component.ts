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
  @Input() analysts: Analyst[]
   filteredUsers: User[] = [];
  
  // Error handling variables
  showSelectionError: boolean = false;
  emailError: string = '';
  formError: string = '';
  selectedUser: User | null = null;

  constructor(private userservice: UsersService, private analystservice: AnalystService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.newUserform = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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
    this.showSelectionError = false;
    
    if (isChecked) {
      this.selectedTableIds = [];
      this.selectedColumnIds = [];
    }
  }

  onTableCheckboxChange(event: any, table: any) {
    const isChecked = event.target.checked;
    this.showSelectionError = false;
    
    if (isChecked) {
      this.selectedDbId = null;
      this.selectedTableIds = [...this.selectedTableIds, table.id];
      this.selectedColumnIds = this.selectedColumnIds.filter(colId => 
        !table.columns.some((col: any) => col.id === colId)
      );
    } else {
      this.selectedTableIds = this.selectedTableIds.filter(id => id !== table.id);
    }
  }

  onColumnCheckboxChange(event: any, column: any) {
    const isChecked = event.target.checked;
    this.showSelectionError = false;
    
    if (isChecked) {
      this.selectedColumnIds = [...this.selectedColumnIds, column.id];
      this.selectedTableIds = this.selectedTableIds.filter(id => id !== column.tableId);
      this.selectedDbId = null;
    } else {
      this.selectedColumnIds = this.selectedColumnIds.filter(id => id !== column.id);
    }
  }

  isExistingUser: boolean = true

  toggleForm() {
    this.isExistingUser = !this.isExistingUser;
    this.formError = '';
    this.emailError = '';
  }

  filterUsers(mail: string) {
    this.emailError = '';
    this.selectedUser = null;
    
    if (this.isEmailComplete(mail)) {
      this.userservice.getUserByMail(mail).subscribe(data => {
        if (data[0]) {
          this.filteredUsers = data;
        } else {
          this.emailError = 'No user found with this email';
        }
      })
    } else {
      this.filteredUsers = [];
    }
  }

  selectUser(user: User) {
    this.selectedUser = user;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (emailInput) {
      emailInput.value = user.mail as string;
    }
    this.filteredUsers = [];
  }

  isEmailComplete(mail: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(mail);
  }

  validateSelection(): boolean {
    if (this.selectedDbId === null && 
        this.selectedTableIds.length === 0 && 
        this.selectedColumnIds.length === 0) {
      this.showSelectionError = true;
      return false;
    }
    return true;
  }

  addUser() {
    this.formError = '';
    this.emailError = '';
    
    // Validate selection
    if (!this.validateSelection()) {
      this.formError = 'Please select at least one database, table, or column';
      return;
    }

    // Validate email
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (!emailInput || !this.isEmailComplete(emailInput.value)) {
      this.emailError = 'Please enter a valid email';
      return;
    }

    // Check if user is selected
    if (!this.selectedUser && this.filteredUsers.length === 0) {
      this.emailError = 'Please select a user from the list';
      return;
    }

    const userToAdd = this.selectedUser || this.filteredUsers[0];
    
    let payload = {
      databaseId: this.selectedDbId,
      tablesIds: this.selectedTableIds,
      columnsIds: this.selectedColumnIds
    }

    if (this.analysts.filter(u => u.identif == userToAdd.identif).length == 0) {
      this.analystservice.linkDatabaseToAnalyst(userToAdd.identif, payload).subscribe({
        next: data => {
          if (data.message == "Database linked successfully") {
            this.analysts.push(data.analyst)
            this.filteredUsers = []
            this.selectedDbId = null
            this.selectedTableIds = []
            this.selectedColumnIds = []
            this.selectedUser = null;
            if (emailInput) emailInput.value = '';
          }
        },
        error: err => {
          this.formError = 'Error adding user: ' + (err.error.message || 'Unknown error');
        }
      });
    } else {
      this.formError = 'This user already has access to this database';
    }
  }

  generatePwd() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newUserform.get("password").setValue(password);
    this.newUserform.get("password").markAsTouched();
  }

  addNewUser() {
    this.formError = '';
    
    // Validate selection
    if (!this.validateSelection()) {
      this.formError = 'Please select at least one database, table, or column';
      return;
    }

    // Validate form
    if (this.newUserform.invalid) {
      this.newUserform.markAllAsTouched();
      this.formError = 'Please fill all required fields correctly';
      return;
    }

    let payload = {
      databaseId: this.selectedDbId,
      tablesIds: this.selectedTableIds,
      columnsIds: this.selectedColumnIds
    }

    this.analystservice.createAnalyst(this.newUserform.value).subscribe({
      next: data => {
        this.analystservice.linkDatabaseToAnalyst(data.identif, payload).subscribe({
          next: data2 => {
            if (data2.message == "Database linked successfully") {
              this.analysts.push(data2.analyst as Analyst)
              this.newUserform.reset()
              this.selectedDbId = null
              this.selectedTableIds = []
              this.selectedColumnIds = []
            }
          },
          error: err => {
            this.formError = 'Error linking database: ' + (err.error.message || 'Unknown error');
          }
        });
      },
      error: err => {
        this.formError = 'Error creating user: ' + (err.error.message || 'Unknown error');
      }
    });
  }
}