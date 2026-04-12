import { Routes } from '@angular/router';
import { DevicesResolver } from './resolvers/devices-resolver';

/**
 * Rutas del módulo de dispositivos con lazy loading
 *
 * @author Bunnystring
 * @since 2026-02-19
 * @version 2.0
 */
export const DEVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/devices/devices.component').then(m => m.DevicesComponent),
    resolve:{ devices: DevicesResolver },
    data: {
      breadcrumb: 'Dispositivos',
      title: 'Gestión de Dispositivos',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/devices-detail/devices-detail.component').then(m => m.DevicesDetailComponent),
    data: {
      breadcrumb: 'Detalle',
      title: 'Detalle del Dispositivo',
    },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
