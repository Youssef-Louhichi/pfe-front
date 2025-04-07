import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MainComponent } from './components/main/main.component';
import { HomeComponent } from './components/home/home.component';
import { UsersComponent } from './components/users/users.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';import { ConnectionsComponent } from './components/connections/connections.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginPageComponent } from './components/login-page/login-page.component'; 
import { DragDropModule } from '@angular/cdk/drag-drop';
import { QueryBuilderComponent } from './components/query-builder/query-builder.component';
import { LMDComponent } from './components/lmd/lmd.component';
import { RapportsComponent } from './components/rapports/rapports.component';
import { TitlePopupComponent } from './components/title-popup/title-popup.component';
import { UserDetailsPopupComponent } from './components/user-details-popup/user-details-popup.component';
import { EditUserProfileComponent } from './components/edit-user-profile/edit-user-profile.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainComponent,
    HomeComponent,
    UsersComponent,
    ConnectionsComponent,
    DashboardComponent,
    LoginPageComponent,
    QueryBuilderComponent,
    LMDComponent,
    RapportsComponent,
    TitlePopupComponent,
    UserDetailsPopupComponent,
    EditUserProfileComponent,
    LoadingSpinnerComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatDialogModule ,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
