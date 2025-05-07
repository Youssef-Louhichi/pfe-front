import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptdetailsComponent } from './scriptdetails.component';

describe('ScriptdetailsComponent', () => {
  let component: ScriptdetailsComponent;
  let fixture: ComponentFixture<ScriptdetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ScriptdetailsComponent]
    });
    fixture = TestBed.createComponent(ScriptdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
