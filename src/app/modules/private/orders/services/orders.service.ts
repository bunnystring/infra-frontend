import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import {CreateOrderRequest, Order} from '../models/orders.model';
import { Observable } from 'rxjs';

/**
 * Servicio para gestionar las operaciones relacionadas con las órdenes, incluyendo la creación, obtención y actualización de órdenes. Utiliza ApiService para comunicarse con el backend y proporciona métodos específicos para cada operación.
 * @since 2026-05-11
 * @author BunnyString
 */
@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  // Injected services
  private apiService = inject(ApiService);

    /**
     * Crea una nueva orden
     * @param order Orden a crear
     * @return Observable con la orden creada
     */
    createOrder(order: Partial<CreateOrderRequest>): Observable<Order> {
      return this.apiService.post<Order>('/orders', order);
    }

    /**
     * Obtiene todas las órdenes
     * @return Observable con la lista de órdenes
     */
    getAllOrders(): Observable<Order[]> {
      return this.apiService.get<Order[]>('/orders');
    }

    /**
     * Obtiene una orden por su ID
     * @param id ID de la orden
     * @return Observable con la orden encontrada
     */
    getOrderById(id: string): Observable<Order> {
      return this.apiService.get<Order>(`/orders/${id}`);
    }

    /**
     * Actualiza el estado de una orden
      * @param id ID de la orden a actualizar
      * @param newState Nuevo estado de la orden
      * @return Observable con la orden actualizada
     */
    updateOrderState(id: string, newState: string): Observable<Order> {
      const formData = new FormData();
      formData.append('newState', newState);
      return this.apiService.putFormData<Order>(`/orders/${id}/state`, formData );
    }

    /**
     * Actualiza una orden existente
     * @param id
     * @param order
     * @returns
     */
    updateOrder(id: string, order: Partial<CreateOrderRequest>): Observable<Order> {
      return this.apiService.put<Order>(`/orders/update/${id}`, order);
    }

}
