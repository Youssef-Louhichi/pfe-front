import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LmdUpdateComponent } from './lmd-update.component';

describe('LmdUpdateComponent', () => {
  let component: LmdUpdateComponent;
  let fixture: ComponentFixture<LmdUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LmdUpdateComponent]
    });
    fixture = TestBed.createComponent(LmdUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
