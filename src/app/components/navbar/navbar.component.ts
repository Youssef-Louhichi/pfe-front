import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { SharedToggleSidebarService } from 'src/app/services/shared-toggle-sidebar.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit{

  user : User;

    constructor(private route: Router,private toggleService: SharedToggleSidebarService , private userservice :    UsersService) { }
  
     isCollapsed:boolean;



     ngOnInit(): void {
      this.toggleService.collapsed$.subscribe(c => {
        this.isCollapsed = c;
      });

       this.userservice.getUserById(Number(localStorage.getItem("userId"))).subscribe(data => {
      this.user = data
    });
    
    }
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      this.toggleService.setCollapsed(this.isCollapsed);
    }
  

  logout(){
    localStorage.removeItem("userId")
        localStorage.removeItem("state")
        this.route.navigate(["/login"])
  }

}
