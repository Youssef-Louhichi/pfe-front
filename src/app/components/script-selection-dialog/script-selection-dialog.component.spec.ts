import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptSelectionDialogComponent } from './script-selection-dialog.component';

describe('ScriptSelectionDialogComponent', () => {
  let component: ScriptSelectionDialogComponent;
  let fixture: ComponentFixture<ScriptSelectionDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ScriptSelectionDialogComponent]
    });
    fixture = TestBed.createComponent(ScriptSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
