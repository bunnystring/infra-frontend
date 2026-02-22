import { Routes } from "@angular/router";
import { OrdersComponent } from "./pages/orders/orders.component";
import { OrdersDetailComponent } from "./pages/orders-detail/orders-detail.component";

/**
 * Rutas del módulo de órdenes con lazy loading
 * Estructura:
 * - /orders -> Lista principal de órdenes
 * - /orders/:id -> Detalle de una orden específica
 *
 * @author Bunnystring
 * @since 2026-02-19
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrdersComponent,
    data: {
      breadcrumb: 'Órdenes',
      title: 'Gestión de Órdenes',
    },
  },
  {
    path: ':id',
    component: OrdersDetailComponent,
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
