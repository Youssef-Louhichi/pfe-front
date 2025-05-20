import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseDiagramComponent } from './database-diagram.component';

describe('DatabaseDiagramComponent', () => {
  let component: DatabaseDiagramComponent;
  let fixture: ComponentFixture<DatabaseDiagramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DatabaseDiagramComponent]
    });
    fixture = TestBed.createComponent(DatabaseDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
