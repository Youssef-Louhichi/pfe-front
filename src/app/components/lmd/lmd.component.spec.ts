import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LMDComponent } from './lmd.component';

describe('LMDComponent', () => {
  let component: LMDComponent;
  let fixture: ComponentFixture<LMDComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LMDComponent]
    });
    fixture = TestBed.createComponent(LMDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
