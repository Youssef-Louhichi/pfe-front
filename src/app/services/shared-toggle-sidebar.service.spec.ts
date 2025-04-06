import { TestBed } from '@angular/core/testing';

import { SharedToggleSidebarService } from './shared-toggle-sidebar.service';

describe('SharedToggleSidebarService', () => {
  let service: SharedToggleSidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedToggleSidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
