import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationsDatabaseComponent } from './relations-database.component';

describe('RelationsDatabaseComponent', () => {
  let component: RelationsDatabaseComponent;
  let fixture: ComponentFixture<RelationsDatabaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RelationsDatabaseComponent]
    });
    fixture = TestBed.createComponent(RelationsDatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
