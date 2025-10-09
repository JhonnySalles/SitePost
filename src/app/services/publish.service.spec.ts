import { TestBed } from '@angular/core/testing';

import { PublishService } from '../services/publish.service';

describe('PublishService', () => {
  let service: PublishService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublishService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
