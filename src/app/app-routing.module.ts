import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { UsersComponent } from './components/users/users.component';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { LMDComponent } from './components/lmd/lmd.component';
import { RapportsComponent } from './components/rapports/rapports.component';

const routes: Routes = [
  {path:"login",title:"EasySql",component:LoginPageComponent},
  {path:"main",title:"EasySql",component:MainComponent,children:[
    {path:"dashboard",component:RapportsComponent},
    {path:"dashboard/edit",component:DashboardComponent},
    {path:"users",component:UsersComponent},
    {path:"rapports",component:RapportsComponent},
    {path:"LMD",component:LMDComponent},

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
