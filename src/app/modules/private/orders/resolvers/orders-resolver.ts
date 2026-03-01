import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { Order } from '../models/Orders';
import { OrdersService } from '../services/orders.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { GroupsService } from '../../groups/services/groups.service';

@Injectable({ providedIn: 'root' })
export class OrdersResolver implements Resolve<Order[] | 'ERROR'> {
  constructor(
    private ordersService: OrdersService,
    private employeesService: EmployeesService,
    private groupsService: GroupsService,
  ) {}

  resolve(): Observable<Order[] | 'ERROR'> {
    return this.ordersService.getAllOrders().pipe(
      concatMap((orders) => {
        if (!orders || orders.length === 0) {
          return of([]);
        }
        const responsibleRequests = orders.map((order) =>
          order.assigneeType === 'EMPLOYEE'
            ? this.employeesService
                .getEmployeeById(order.assigneeId)
                .pipe(catchError(() => of(null)))
            : order.assigneeType === 'GROUP'
              ? this.groupsService
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
      catchError((err) => {
        console.error('Error al cargar las órdenes:', err);
        return of('ERROR' as const);
      }),
    );
  }
}
