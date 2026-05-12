import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { OrdersStore } from '../store/orders.store';

export const ordersResolver: ResolveFn<boolean> = () =>
  inject(OrdersStore).loadOrders().pipe(map(() => true));
