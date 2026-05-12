import { Routes } from "@angular/router";
import { ordersResolver } from "./resolvers/orders-resolver";

/**
 * Rutas del módulo de órdenes con lazy loading
 *
 * @author Bunnystring
 * @since 2026-02-19
 * @version 2.0
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),
    resolve: { orders: ordersResolver },
    data: {
      breadcrumb: 'Órdenes',
      title: 'Gestión de Órdenes',
    },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/orders-detail/orders-detail.component').then(m => m.OrdersDetailComponent),
    data: {
      breadcrumb: 'Detalle',
      title: 'Detalle de la Orden',
    },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  }
]
