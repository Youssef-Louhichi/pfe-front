import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Rapport } from 'src/app/models/rapport';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit{


    constructor(private userService:UsersService,private router:Router
    ) { }

    rapports:Rapport[]

    ngOnInit(): void {
      this.userService.getUserById(Number(localStorage.getItem("userId"))).subscribe(data =>{
        this.rapports = data.rapports
      })

    }

    openRapport(rapport:Rapport){
      this.router.navigate(["/main/dashboard",{ state: { rapport: rapport } }])
    }

    openNewRapport(){
      this.router.navigate(["/main/dashboard"],{ state:{ rapport: new Rapport(1,"null",[],null,null) }})
    }

}
