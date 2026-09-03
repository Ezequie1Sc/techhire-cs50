import { TestBed } from '@angular/core/testing';

import { JoblyAiService } from './jobly-ai.service';

describe('JoblyAiService', () => {
  let service: JoblyAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JoblyAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
