import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '@shared/layouts';
import { PrivateLayoutComponent } from '@shared/layouts';
import { authGuard } from '@auth/data-access';
import { publicAuthGuard } from '@auth/data-access';


export const routes: Routes = [

  // ========== REDIRECCIÓN POR DEFECTO ==========
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // ========== RUTAS PÚBLICAS (AUTH) ==========
  {
    path: 'auth',
    component: PublicLayoutComponent,
    canActivate: [publicAuthGuard],
    children: [
      {
        path: 'login',
        loadChildren: () => import('@auth/feature-login').then(m => m.featureLoginRoutes)
      },
      {
        path: 'register',
        loadChildren: () => import('@auth/feature-register').then(m => m.featureRegisterRoutes)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
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
        loadChildren: () => import('@devices/feature-devices').then(m => m.featureDevicesRoutes),
        data: { breadcrumb: 'Dashboard' }
      },
      {
        path: 'devices',
        loadChildren: () => import('@devices/feature-devices').then(m => m.featureDevicesRoutes),
        data: { breadcrumb: 'Devices' }
      }
    ]
  },

  // ========== RUTA 404 ==========
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
