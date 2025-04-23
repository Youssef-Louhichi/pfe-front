import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LmdInsertComponent } from './lmd-insert.component';

describe('LmdInsertComponent', () => {
  let component: LmdInsertComponent;
  let fixture: ComponentFixture<LmdInsertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LmdInsertComponent]
    });
    fixture = TestBed.createComponent(LmdInsertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
