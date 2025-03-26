import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetRapportComponent } from './get-rapport.component';

describe('GetRapportComponent', () => {
  let component: GetRapportComponent;
  let fixture: ComponentFixture<GetRapportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GetRapportComponent]
    });
    fixture = TestBed.createComponent(GetRapportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
