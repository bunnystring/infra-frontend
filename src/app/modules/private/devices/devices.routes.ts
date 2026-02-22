import { Routes } from '@angular/router';
import { DevicesComponent } from './pages/devices/devices.component';
import { DevicesDetailComponent } from './pages/devices-detail/devices-detail.component';

/**
 * Rutas del módulo de dispositivos con lazy loading
 *
 * Estructura:
 * - /devices -> Lista principal de dispositivos
 * - /devices/:id -> Detalle de un dispositivo específico
 *
 * @author Bunnystring
 * @since 2026-02-19
 */
export const DEVICES_ROUTES: Routes = [
  {
    path: '',
    component: DevicesComponent,
    data: {
      breadcrumb: 'Dispositivos',
      title: 'Gestión de Dispositivos',
    },
  },
  {
    path: ':id',
    component: DevicesDetailComponent,
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
