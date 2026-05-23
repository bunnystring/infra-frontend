import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Observable, catchError, of, tap } from 'rxjs';
import { Employee, EmployeeStatus } from '../models/employee.model';
import { EmployeesService } from '../services/employees.service';

interface EmployeesState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Store centralizado para gestionar el estado de los empleados.
 * @since 2026-05-13
 * @author BunnyString
 */
export const EmployeesStore = signalStore(
  { providedIn: 'root' },
  withState<EmployeesState>({
    employees: [],
    isLoading: false,
    error: null,
  }),
  withComputed(({ employees }) => ({
    stats: computed(() => {
      const list = employees();
      return {
        total: list.length,
        active: list.filter((e) => e.status === EmployeeStatus.ACTIVE).length,
        inactive: list.filter((e) => e.status === EmployeeStatus.INACTIVE).length,
      };
    }),
  })),
  withMethods((store) => {
    const employeesService = inject(EmployeesService);

    return {
      loadEmployees(): Observable<Employee[]> {
        patchState(store, { isLoading: true, error: null });
        return employeesService.getAllEmployees().pipe(
          tap((employees) => patchState(store, { employees, isLoading: false })),
          catchError((err) => {
            console.error('Error al cargar empleados:', err);
            patchState(store, { error: 'Error al cargar empleados', isLoading: false });
            return of([]);
          }),
        );
      },

      upsertEmployee(employee: Employee): void {
        patchState(store, (state) => ({
          employees: state.employees.some((e) => e.id === employee.id)
            ? state.employees.map((e) => (e.id === employee.id ? employee : e))
            : [...state.employees, employee],
        }));
      },

      removeEmployee(id: string): void {
        patchState(store, (state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        }));
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
