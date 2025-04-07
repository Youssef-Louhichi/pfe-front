import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsPopupComponent } from './user-details-popup.component';

describe('UserDetailsPopupComponent', () => {
  let component: UserDetailsPopupComponent;
  let fixture: ComponentFixture<UserDetailsPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserDetailsPopupComponent]
    });
    fixture = TestBed.createComponent(UserDetailsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
