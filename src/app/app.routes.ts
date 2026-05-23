import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layouts/private/private-layout/private-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { publicAuthGuard } from './core/guards/public-auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  {
    path: 'auth',
    canMatch: [publicAuthGuard],
    component: PublicLayoutComponent,
    loadChildren: () => import('./modules/public/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  {
    path: 'app',
    component: PrivateLayoutComponent,
    canMatch: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/private/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'devices',
        loadChildren: () => import('./modules/private/devices/devices.routes').then(m => m.DEVICES_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('./modules/private/orders/orders.routes').then(m => m.ORDERS_ROUTES),
      },
      {
        path: 'employees',
        loadChildren: () => import('./modules/private/employees/employees.routes').then(m => m.EMPLOYEES_ROUTES),
      },
      {
        path: 'groups',
        loadChildren: () => import('./modules/private/groups/groups.routes').then(m => m.GROUPS_ROUTES),
      }
    ]
  },

  // ========== RUTA 404 ==========
  {
    path: '**',
    redirectTo: '/auth/login'
  }

];
