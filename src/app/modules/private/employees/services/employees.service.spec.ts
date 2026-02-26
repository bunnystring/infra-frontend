/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EmployeesService } from './employees.service';

describe('Service: Employees', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmployeesService]
    });
  });

  it('should ...', inject([EmployeesService], (service: EmployeesService) => {
    expect(service).toBeTruthy();
  }));
});
