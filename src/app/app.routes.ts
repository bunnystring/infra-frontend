import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layouts/private/private-layout/private-layout.component';
import { authGuard } from './core/guards/auth.guards';
import { publicAuthGuard } from './core/guards/public-auth.guard';

/**
 * Rutas principales de la aplicación
 * Define la estructura de navegación global, incluyendo rutas públicas y privadas
 * - Las rutas públicas están protegidas por el guard `publicAuthGuard` para evitar acceso de usuarios autenticados
 * - Las rutas privadas están protegidas por el guard `authGuard` para asegurar que solo usuarios autenticados puedan acceder
 * - Se utiliza lazy loading para cargar los módulos de forma eficiente
 * @since 2026-02-19
 * @author Bunnystring
 */
export const routes: Routes = [

  // Redirecciones por defecto
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Rutas publicas
  {
    path: 'auth',
    canActivate: [publicAuthGuard],
    component: PublicLayoutComponent,
    loadChildren: () => import('./modules/public/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'register',
    canActivate: [publicAuthGuard],
    component: PublicLayoutComponent,
    loadChildren: () => import('./modules/public/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ========== RUTAS PRIVADAS ==========

  {
    path: 'app',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/private/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        data: { breadcrumb: 'Dashboard' }
      },
      {
        path: 'devices',
        loadChildren: () => import('./modules/private/devices/devices.routes').then(m => m.DEVICES_ROUTES),
        data: { breadcrumb: 'Devices' }
      },
      {
        path: 'orders',
        loadChildren: () => import('./modules/private/orders/orders.routes').then(m => m.ORDERS_ROUTES),
        data: { breadcrumb: 'Orders' }
      }
      /*
      {
        path: 'employees',
        loadChildren: () => import('./modules/private/employees/employees.routes').then(m => m.EMPLOYEES_ROUTES),
        data: { breadcrumb: 'Employees' }
      },
      {
        path: 'groups',
        loadChildren: () => import('./modules/private/groups/groups.routes').then(m => m.GROUPS_ROUTES),
        data: { breadcrumb: 'Groups' }
      }*/
    ]
  },

  // ========== RUTA 404 ==========
  {
    path: '**',
    redirectTo: '/auth/login'
  }

];
