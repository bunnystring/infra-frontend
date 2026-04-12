import { Routes } from "@angular/router";

/**
 * Rutas del módulo de dashboard con lazy loading
 * @author Bunnystring
 * @since 2026-04-11
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
    data: { breadcrumb: 'Inicio' }
  }
];
