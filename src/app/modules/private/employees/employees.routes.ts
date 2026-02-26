import { Routes } from '@angular/router';
import { EmployeesComponent } from './pages/employees/employees.component';
import { EmployeesDetailComponent } from './pages/employees-detail/employees-detail.component';

/**
 * Rutas del módulo de empleados con lazy loading
 * Estructura:
 * - /employees -> Lista principal de empleados
 * - /employees/:id -> Detalle de un empleado específico
 *
 * @since 2026-02-19
 * @author Bunnystring
 */
export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    component: EmployeesComponent,
    data: {
      breadcrumb: 'Empleados',
      title: 'Gestión de Empleados',
    },
  },
  {
    path: ':id',
    component: EmployeesDetailComponent,
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
