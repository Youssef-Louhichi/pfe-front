import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedToggleSidebarService } from 'src/app/services/shared-toggle-sidebar.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit{

    constructor(private route: Router,private toggleService: SharedToggleSidebarService) { }
  
     isCollapsed:boolean;



     ngOnInit(): void {
      this.toggleService.collapsed$.subscribe(c => {
        this.isCollapsed = c;
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
