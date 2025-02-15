import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { ConnectionsComponent } from './components/connections/connections.component';

const routes: Routes = [
  {path:"main",title:"EasySql",component:MainComponent,children:[
    
    {path:"connections",component:ConnectionsComponent}
  ]},
  {path:"",redirectTo:"main",pathMatch:'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
