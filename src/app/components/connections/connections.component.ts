import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/models/user';
import { ConnexionsService } from 'src/app/services/connexions.service';
import { UsersService } from 'src/app/services/users.service';
import { HomeComponent } from '../home/home.component';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.css']
})
export class ConnectionsComponent implements OnInit {

  form: FormGroup;
  db_type: string = "MySQL";
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private connexionService: ConnexionsService,
    private userService: UsersService,
    private dialogRef: MatDialogRef<HomeComponent>
  ) {}

  creator: User;

  ngOnInit(): void {
    let idUser = Number(localStorage.getItem("userId"));

    this.userService.getUserById(idUser).subscribe(data => this.creator = data);
    
    this.form = this.fb.group({
      host: ['', Validators.required],
      port: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      dbtype: ['MySQL'],
      creator: []
    });
  }

  changeDb(i: number) {
    this.errorMessage = "";
    
    if (i == 1) {
      this.form.reset();
      this.form.get("dbtype").setValue("MySQL");
      this.db_type = "MySQL";
    }
    if (i == 2) {
      this.form.reset();
      this.form.get("dbtype").setValue("Oracle");
      this.db_type = "Oracle";
    }
  }

  insertConnection() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return; 
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.form.get("creator").setValue(this.creator);
    this.connexionService.insertConnexion(this.form.value).subscribe(
      data => {
        this.dialogRef.close(data);
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
        if (error.status == 500) {
          this.errorMessage = "Failed to establish connection. Please check your credentials and try again.";
        } else {
          this.errorMessage = "An unexpected error occurred. Please try again later.";
        }
      }
    );
  }
}