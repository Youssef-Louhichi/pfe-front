import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbsStatisticsComponent } from './dbs-statistics.component';

describe('DbsStatisticsComponent', () => {
  let component: DbsStatisticsComponent;
  let fixture: ComponentFixture<DbsStatisticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DbsStatisticsComponent]
    });
    fixture = TestBed.createComponent(DbsStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
