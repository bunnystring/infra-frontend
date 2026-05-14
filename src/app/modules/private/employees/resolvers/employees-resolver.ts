import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { EmployeesStore } from '../store/employees.store';

export const employeesResolver: ResolveFn<boolean> = () =>
  inject(EmployeesStore).loadEmployees().pipe(map(() => true));
