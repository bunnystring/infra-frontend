import { TestBed } from '@angular/core/testing';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GroupsService],
    });
  });

  it('debe ser creado', () => {
    const service = TestBed.inject(GroupsService);
    expect(service).toBeTruthy();
  });
});
