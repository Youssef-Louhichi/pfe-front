import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LmdDeleteComponent } from './lmd-delete.component';

describe('LmdDeleteComponent', () => {
  let component: LmdDeleteComponent;
  let fixture: ComponentFixture<LmdDeleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LmdDeleteComponent]
    });
    fixture = TestBed.createComponent(LmdDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
