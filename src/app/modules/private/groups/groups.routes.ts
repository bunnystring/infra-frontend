import { Routes } from "@angular/router";
import { GroupsComponent } from "./pages/groups/groups.component";
import { GroupsDetailComponent } from "./pages/groups-detail/groups-detail.component";

/**
 * Rutas del módulo de grupos con lazy loading
 * Estructura:
 * - /groups -> Lista principal de grupos
 * - /groups/:id -> Detalle de un grupo específico
 *
 * @since 2026-02-19
 * @author Bunnystring
 */
export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    component: GroupsComponent,
    data: {
      breadcrumb: 'Grupos',
      title: 'Gestión de Grupos',
    },
  },
  {
    path: ':id',
    component: GroupsDetailComponent,
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
