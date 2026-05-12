import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  Observable,
  catchError,
  concatMap,
  forkJoin,
  map,
  of,
  tap,
} from 'rxjs';
import { Order, OrderStates, OrdersState } from '../models/Orders';
import { OrdersService } from '../services/orders.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { GroupsService } from '../../groups/services/groups.service';


/**
 * Store para gestionar el estado de las órdenes, incluyendo la carga, actualización y eliminación de órdenes, así como el manejo de errores y estados de carga.
 * @since 2026-05-11
 * @author BunnyString
 */
export const OrdersStore = signalStore(
  { providedIn: 'root' },
  withState<OrdersState>({
    orders: [],
    isLoading: false,
    error: null,
  }),
  withComputed(({ orders }) => ({
    stats: computed(() => {
      const list = orders();
      return {
        totalOrders: list.length,
        created: list.filter((o) => o.state === OrderStates.CREATED).length,
        inProcess: list.filter((o) => o.state === OrderStates.IN_PROCESS).length,
        dispatched: list.filter((o) => o.state === OrderStates.DISPATCHED).length,
        finished: list.filter((o) => o.state === OrderStates.FINISHED).length,
      };
    }),
  })),
  withMethods((store) => {
    const ordersService = inject(OrdersService);
    const employeesService = inject(EmployeesService);
    const groupsService = inject(GroupsService);

    return {
      loadOrders(): Observable<Order[]> {
        patchState(store, { isLoading: true, error: null });
        return ordersService.getAllOrders().pipe(
          concatMap((orders) => {
            if (!orders || orders.length === 0) return of([]);
            const responsibleRequests = orders.map((order) =>
              order.assigneeType === 'EMPLOYEE'
                ? employeesService
                    .getEmployeeById(order.assigneeId)
                    .pipe(catchError(() => of(null)))
                : order.assigneeType === 'GROUP'
                  ? groupsService
                      .getGroupById(order.assigneeId)
                      .pipe(catchError(() => of(null)))
                  : of(null),
            );
            return forkJoin(responsibleRequests).pipe(
              map((responsibles) =>
                orders.map((order, i) => ({
                  ...order,
                  assignee: responsibles[i],
                })),
              ),
            );
          }),
          tap((orders) => patchState(store, { orders, isLoading: false })),
          catchError((err) => {
            console.error('Error al cargar órdenes:', err);
            patchState(store, { error: 'Error al cargar órdenes', isLoading: false });
            return of([]);
          }),
        );
      },

      upsertOrder(order: Order): void {
        patchState(store, (state) => ({
          orders: state.orders.some((o) => o.id === order.id)
            ? state.orders.map((o) => (o.id === order.id ? order : o))
            : [...state.orders, order],
        }));
      },

      removeOrder(id: string): void {
        patchState(store, (state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
