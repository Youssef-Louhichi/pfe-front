import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {

  constructor(private fb: FormBuilder,private route: Router,private userservice:UsersService) { }

  signForm!: FormGroup
  isLoading=false
  logForm!: FormGroup
  switch: boolean = true;


  ngOnInit(): void {
    this.initializeLoginForm()
    this.initializeClientForm()
  }

  initializeLoginForm(){
    this.logForm = this.fb.group({
      login: ['', Validators.required],
      pwd: ['', Validators.required]
       
    });
  }

  initializeClientForm(){
    this.signForm = this.fb.group({
      idCl: [],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      pwd: ['', [Validators.required , Validators.minLength(8)]],
    });
  }

    toggle(): void {
        this.switch = !this.switch;
    }

   


    signIn(){
      console.log(this.logForm.value)
      
    this.userservice.login(this.logForm.get("login")?.value,this.logForm.get("pwd")?.value).subscribe(res =>{
      if (res){
        console.log(res)
        localStorage.setItem("userId",res.user.identif.toString())
        localStorage.setItem("state","connectedUser")
        this.route.navigate(["/home"])
      }
    
    })
    }

    signUp(){

    }

}
