import { TestBed } from '@angular/core/testing';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmployeesService],
    });
  });

  it('debe ser creado', () => {
    const service = TestBed.inject(EmployeesService);
    expect(service).toBeTruthy();
  });
});
