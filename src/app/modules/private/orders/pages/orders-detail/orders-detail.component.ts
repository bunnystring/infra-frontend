import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { OrdersService } from '../../services/orders.service';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../../../core/services/loading.service';
import { Observable, tap, exhaustMap, catchError, takeUntil, switchMap, of } from 'rxjs';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Order } from '../../models/Orders';

@Component({
  selector: 'app-orders-detail',
  templateUrl: './orders-detail.component.html',
  styleUrls: ['./orders-detail.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class OrdersDetailComponent implements OnInit, OnDestroy {

  // Modelo de vista para la orden
  order: Order | null = null;

  // Estado de error
  error: string = '';

  // Observable para el estado de carga
  get loading$() {
    return this.loadingService.loading$;
  }

  // Subject para manejar la destrucción del componente y evitar fugas de memoria
  private readonly destroy$ = new Subject<void>();

  constructor(
    private location: Location,
    private ordersService: OrdersService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
  ) { }

  /**
   * Inicializar el componente y cargar los detalles de la orden
   * Llama al método getOrderDetail para cargar los detalles de la orden cuando el componente se inicializa. Este método se suscribe a los parámetros de la ruta para obtener el ID de la orden y luego llama al servicio para obtener los detalles de la orden, manejando cualquier error que pueda ocurrir durante la carga.
   * @returns void
   */
  ngOnInit() {
    this.getOrderDetail();
  }

  /**
   * Limpiar los recursos y evitar fugas de memoria al destruir el componente
   * Emite un valor al Subject destroy$ para completar cualquier suscripción que esté escuchando este Subject, lo que ayuda a evitar fugas de memoria al asegurarse de que las suscripciones se limpien correctamente cuando el componente se destruya.
   * @returns void
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar los detalles de la orden utilizando el ID de la ruta y manejar errores
   * Obtiene el ID de la orden desde los parámetros de la ruta, luego llama al servicio para obtener los detalles de la orden.
   * @returns void
   */
   getOrderDetail(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.error = '';
      }),
      switchMap(params =>
        this.ordersService.getOrderById(params['id']).pipe(
          tap(order => {
            this.order = order;
            console.log('Orden cargada:', order);
          }),
          catchError(err => {
            this.error = err?.error?.message || 'Error al cargar orden';
            toast.error('Error al cargar la orden', { description: this.error });
            this.order = null;
            return of(null);
          })
        )
      )
    ).subscribe();
  }

  /**
   * Navegar hacia atrás en la historia del navegador
   * Llama al método back del servicio Location para navegar hacia atrás en la historia del navegador, lo que permite al usuario regresar a la página anterior.
   * @returns void
   */
  goBack(): void {
    this.location.back();
  }

}
