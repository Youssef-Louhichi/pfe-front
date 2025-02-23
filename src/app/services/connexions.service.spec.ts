import { TestBed } from '@angular/core/testing';

import { ConnexionsService } from './connexions.service';

describe('ConnexionsService', () => {
  let service: ConnexionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnexionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
