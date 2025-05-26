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
import { AddUserComponent } from './components/add-user/add-user.component';
import { ListUserComponent } from './components/list-user/list-user.component';
import { TaskPopupComponent } from './components/task-popup/task-popup.component';
import { MyTasksComponent } from './components/my-tasks/my-tasks.component';
import { LmdInsertComponent } from './components/lmd-insert/lmd-insert.component';
import { LmdUpdateComponent } from './components/lmd-update/lmd-update.component';
import { LmdDeleteComponent } from './components/lmd-delete/lmd-delete.component';
import { TestComponent } from './components/test/test.component';
import { ScriptSelectionDialogComponent } from './components/script-selection-dialog/script-selection-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CreateScriptComponent } from './components/create-script/create-script.component';
import { ScriptdetailsComponent } from './components/scriptdetails/scriptdetails.component';
import { DatabaseDiagramComponent } from './components/database-diagram/database-diagram.component';
import { FilesizePipe } from './pipes/filesize.pipe';
import { DbsStatisticsComponent } from './components/dbs-statistics/dbs-statistics.component';
import { RelationsDatabaseComponent } from './components/relations-database/relations-database.component';
import { QueryExplainComponent } from './components/query-explain/query-explain.component';
import { MarkdownToHtmlPipe } from './pipes/markdown-to-html.pipe';

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
    AddUserComponent,
    ListUserComponent,
    TaskPopupComponent,
    MyTasksComponent,
    LmdInsertComponent,
    LmdUpdateComponent,
    LmdDeleteComponent,
    TestComponent,
    ScriptSelectionDialogComponent,
    CreateScriptComponent,
    ScriptdetailsComponent,
    DatabaseDiagramComponent,
    FilesizePipe,
    DbsStatisticsComponent,
    RelationsDatabaseComponent,
    
    QueryExplainComponent,
    MarkdownToHtmlPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatDialogModule ,
    DragDropModule,
    MatListModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
