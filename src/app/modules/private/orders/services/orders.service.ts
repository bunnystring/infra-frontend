import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import {CreateOrderRequest, Order} from '../models/orders.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  // Injected services
  private apiService = inject(ApiService);

    createOrder(order: Partial<CreateOrderRequest>): Observable<Order> {
      return this.apiService.post<Order>('/orders', order);
    }

    getAllOrders(): Observable<Order[]> {
      return this.apiService.get<Order[]>('/orders');
    }

    getOrderById(id: string): Observable<Order> {
      return this.apiService.get<Order>(`/orders/${id}`);
    }

    updateOrderState(id: string, newState: string): Observable<Order> {
      const formData = new FormData();
      formData.append('newState', newState);
      return this.apiService.putFormData<Order>(`/orders/${id}/state`, formData );
    }

    updateOrder(id: string, order: Partial<CreateOrderRequest>): Observable<Order> {
      return this.apiService.put<Order>(`/orders/update/${id}`, order);
    }

}
