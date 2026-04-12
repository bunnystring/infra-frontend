import { Routes } from "@angular/router";

/**
 * Rutas del módulo de grupos con lazy loading
 *
 * @since 2026-02-19
 * @author Bunnystring
 * @version 2.0
 */
export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent),
    data: {
      breadcrumb: 'Grupos',
      title: 'Gestión de Grupos',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/groups-detail/groups-detail.component').then(m => m.GroupsDetailComponent),
    data: {
      breadcrumb: 'Detalle',
      title: 'Detalle del Grupo',
    },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  }
];
