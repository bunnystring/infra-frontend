import { Routes } from '@angular/router';
import { employeesResolver } from './resolvers/employees-resolver';

/**
 * Rutas del módulo de empleados con lazy loading
 *
 * @since 2026-02-19
 * @author Bunnystring
 * @version 2.0
 */
export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/employees/employees.component').then(m => m.EmployeesComponent),
    resolve: { employees: employeesResolver },
    data: {
      breadcrumb: 'Empleados',
      title: 'Gestión de Empleados',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/employees-detail/employees-detail.component').then(m => m.EmployeesDetailComponent),
    data: {
      breadcrumb: 'Detalle',
      title: 'Detalle del Empleado',
    },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
