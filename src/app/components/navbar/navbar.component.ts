import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

    constructor(private route: Router) { }
    isCollapsed = false;

    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    }
  

  logout(){
    localStorage.removeItem("userId")
        localStorage.removeItem("state")
        this.route.navigate(["/login"])
  }

}
