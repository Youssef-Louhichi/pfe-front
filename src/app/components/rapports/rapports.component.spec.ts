import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportsComponent } from './rapports.component';

describe('RapportsComponent', () => {
  let component: RapportsComponent;
  let fixture: ComponentFixture<RapportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RapportsComponent]
    });
    fixture = TestBed.createComponent(RapportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
