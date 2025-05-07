import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateScriptComponent } from './create-script.component';

describe('CreateScriptComponent', () => {
  let component: CreateScriptComponent;
  let fixture: ComponentFixture<CreateScriptComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateScriptComponent]
    });
    fixture = TestBed.createComponent(CreateScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
