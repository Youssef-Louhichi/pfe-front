import {  Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { Requete } from 'src/app/models/requete';
import { Script } from 'src/app/models/script';
import { User } from 'src/app/models/user';
import { RequeteService } from 'src/app/services/requete.service';
import { ScriptServiceService } from 'src/app/services/script-service.service';
import { UsersService } from 'src/app/services/users.service';


@Component({
  selector: 'app-create-script',
  templateUrl: './create-script.component.html',
  styleUrls: ['./create-script.component.css']
})
export class CreateScriptComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() createScript = new EventEmitter<Script>();

  scriptForm: FormGroup;
  currentUser: User;
  reqs: Requete[] = [];
  currentStep: number = 1;
  selectedQueryIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UsersService,
    private scriptservice: ScriptServiceService,
    private reqService: RequeteService
  ) {
    this.scriptForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      queries: [[], [Validators.required]] // Array for selected query IDs

      
    });
  }

  ngOnInit() {
    const userId = Number(localStorage.getItem('userId'));
    this.getReq(userId);
  }

  onQuerySelectionChange(event: Event, queryId: number) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedQueryIds.push(queryId);
    } else {
      this.selectedQueryIds = this.selectedQueryIds.filter(id => id !== queryId);
    }
    this.scriptForm.get('queries')?.setValue(this.selectedQueryIds);
    this.scriptForm.get('queries')?.updateValueAndValidity();
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  onSubmit() {
    this.userService.getUserById(Number(localStorage.getItem('userId'))).subscribe(
      (userData) => {
        this.currentUser = userData;

        if (this.scriptForm.valid) {
          const newScript = new Script(
            this.scriptForm.get('name')?.value,
            new Date(),
            this.currentUser
          );

          this.scriptservice.createScript(newScript).subscribe({
            next: (createdScript) => {
              const addQueryObservables: Observable<string>[] = this.selectedQueryIds.map((requeteId: number) =>
                this.scriptservice.addRequeteToScripts([createdScript.id], requeteId)
              );

              forkJoin(addQueryObservables).subscribe({
                next: () => {
                  this.createScript.emit(createdScript);
                  this.close.emit();
                },
                error: (error) => {
                  console.error('Error associating queries with script:', error);
                }
              });
            },
            error: (error) => {
              console.error('Error creating script:', error);
            }
          });
        }
      },
      (error) => {
        console.error('Error getting user data:', error);
      }
    );
  }

  onClose() {
    this.close.emit();
  }

  getReq(senderId: any) {
    this.reqService.getUserReq(senderId).subscribe(data => {
      this.reqs = data;
    });
  }
}