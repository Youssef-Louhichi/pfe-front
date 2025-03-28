import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { ConnectionsComponent } from './components/connections/connections.component';
import { UsersComponent } from './components/users/users.component';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { GetRapportComponent } from './components/get-rapport/get-rapport.component';

const routes: Routes = [
  {path:"login",title:"EasySql",component:LoginPageComponent},
  {path:"main",title:"EasySql",component:MainComponent,children:[
    {path:"dashboard",component:DashboardComponent},
    {path:"users",component:UsersComponent},
    {path:"getrapport",component:GetRapportComponent},
    {path:"",redirectTo:"dashboard",pathMatch:'full'}
  ]},
  {path:"home",title:"EasySql",component:HomeComponent},
  {path:"",redirectTo:"login",pathMatch:'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
