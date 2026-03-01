import { Component, OnDestroy, OnInit } from '@angular/core';
import { OrdersService } from '../../services/orders.service';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../../../core/services/loading.service';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  takeUntil,
  BehaviorSubject,
  Observable,
  combineLatest,
  startWith,
  map,
  tap,
  catchError,
  concatMap,
  of,
  forkJoin,
} from 'rxjs';
import { OrderCreateEditModalComponent } from '../../modals/order-create-edit-modal/order-create-edit-modal.component';
import { OrderDeleteModalComponent } from '../../modals/order-delete-modal/order-delete-modal.component';
import {
  Order,
  OrderStates,
  OrderStateLabels,
  OrderStatusColors,
  OrderFormResult,
} from '../../models/Orders';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeesService } from '../../../employees/services/employees.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderCreateEditModalComponent,
    OrderDeleteModalComponent,
  ],
})
export class OrdersComponent implements OnInit, OnDestroy {
  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  // Orden seleccionada para editar o eliminar
  orderToEdit: Order | null = null;
  orderToDelete: Order | null = null;

  // Modo del formulario: 'create' o 'edit'
  formMode: 'create' | 'edit' = 'create';

  // Subject para manejar la destrucción del componente y evitar memory leaks en los subscriptions
  private readonly destroy$ = new Subject<void>();

  // Observable para el estado de carga global, se puede usar para mostrar un spinner global mientras se cargan los dispositivos
  get loading$() {
    return this.loadingService.loading$;
  }

  // Estado de carga y error
  submitted = false;
  orderErrorMessage = '';
  isRetrying = false;
  orderError = false;

  // Filtros como BehaviorSubject
  search$ = new BehaviorSubject<string>('');
  statusFilter$ = new BehaviorSubject<OrderStates | 'ALL'>('ALL');

  // Mapas para etiquetas y colores de estado
  get search(): string {
    return this.search$.value;
  }

  // Getters y Setters para filtros
  set search(val: string) {
    this.search$.next(val);
  }

  // El filtro de estado puede ser un OrderStates o 'ALL' para mostrar todos
  get statusFilter(): OrderStates | 'ALL' {
    return this.statusFilter$.value;
  }

  // El setter actualiza el BehaviorSubject para que los observables dependientes se actualicen automáticamente
  set statusFilter(val: OrderStates | 'ALL') {
    this.statusFilter$.next(val);
  }

  // Fuente de datos principal de órdenes, se actualiza al cargar o modificar órdenes
  orders$ = new BehaviorSubject<Order[]>([]);

  // Mapas para etiquetas y colores de estado
  OrderStates = OrderStates;
  OrderStateLabels = OrderStateLabels;
  OrderStatusColors = OrderStatusColors;

  // Stats locales
  stats = {
    totalOrders: 0,
    created: 0,
    inProgress: 0,
    dispatched: 0,
    finished: 0,
  };

  // Paginación
  page = 1;
  pageSize = 10;
  totalItems = 0;

  // Observable de órdenes filtradas según los filtros de búsqueda y estado
  get pagedOrders$(): Observable<Order[]> {
    return this.filteredOrders$.pipe(
      map((orders) =>
        orders.slice(
          (this.page - 1) * this.pageSize,
          this.page * this.pageSize,
        ),
      ),
    );
  }

  // Lista de órdenes filtradas para mostrar en la tabla, se actualiza automáticamente cuando cambian las órdenes o los filtros
  filteredOrders: Order[] = [];

  // Flag para controlar la disponibilidad de los botones de acción (crear, editar, eliminar)
  buttonsIsAvailable = true;

  constructor(
    private ordersService: OrdersService,
    private loadingService: LoadingService,
    private employeesService: EmployeesService,
    private groupsService: GroupsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.initOrdersData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa la lista de órdenes a partir de los datos resueltos por el OrdersResolver.
   * Maneja los casos de error, lista vacía y carga exitosa, actualizando el estado del componente y mostrando mensajes adecuados.
   * @returns void
   */
  initOrdersData(): void {
    const resolved = this.route.snapshot.data['orders'];

    if (resolved === 'ERROR') {
      toast.error('No se pudo conectar al microservicio de órdenes.');
      this.orderError = true;
      this.orderErrorMessage = 'Error de conexión al backend.';
      this.orders$.next([]);
      this.buttonsIsAvailable = false;
      return;
    }

    if (!resolved || resolved.length === 0) {
      toast.info('No hay órdenes para mostrar actualmente.');
      this.orderError = false;
      this.orderErrorMessage = '';
      this.orders$.next([]);
      this.buttonsIsAvailable = true;
      return;
    }

    this.buttonsIsAvailable = true;
    this.orderError = false;
    this.orderErrorMessage = '';
    this.orders$.next(resolved);
  }

  /**
   * Observable que combina la lista de órdenes con los filtros de búsqueda y estado para producir una lista filtrada de órdenes que se muestra en la tabla. Se actualiza automáticamente cada vez que cambian las órdenes o los filtros.
   * - Combina el observable de órdenes con los filtros de búsqueda y estado usando combineLatest.
   * - Aplica un filtro a la lista de órdenes para incluir solo aquellas que coinciden con el texto de búsqueda y el estado seleccionado.
   * - Actualiza la propiedad totalItems para la paginación y la lista filteredOrders que se muestra en la tabla.
   * @returns Observable<Order[]> Lista filtrada de órdenes según los criterios de búsqueda y estado.
   */
  filteredOrders$: Observable<Order[]> = combineLatest([
    this.orders$,
    this.search$.pipe(startWith('')),
    this.statusFilter$.pipe(startWith('ALL')),
  ]).pipe(
    map(([orders, search, filter]) =>
      orders.filter(
        (o) =>
          this.matchSearch(o, search) &&
          (filter === 'ALL' || o.state === filter),
      ),
    ),
    tap(
      (orders) => (
        (this.totalItems = orders.length),
        (this.filteredOrders = orders)
      ),
    ),
  );

  /** Verifica si una orden coincide con el texto de búsqueda en su nombre, marca o código de barras
   * @param order Orden a verificar
   * @param search Texto de búsqueda ingresado por el usuario
   * @returns boolean Verdadero si la orden coincide con la búsqueda, falso en caso contrario
   */
  private matchSearch(order: Order, search: string): boolean {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      order.description.toLowerCase().includes(lower) ||
      order.assigneeType.toLowerCase().includes(lower) ||
      order.state.toLowerCase().includes(lower)
    );
  }

  /**
   * Carga la lista de órdenes desde el servicio, maneja errores y actualiza las estadísticas
   * - Limpia el mensaje de error y el flag de error antes de cargar.
   * - Llama al servicio para obtener todas las órdenes.
   * - Para cada orden, obtiene el responsable (empleado o grupo) según su tipo y maneja errores individuales para cada solicitud de responsable.
   * - Combina la información del responsable con cada orden y actualiza el observable de órdenes.
   * - Actualiza las estadísticas de órdenes según su estado.
   * - Maneja errores globales al cargar las órdenes y muestra un mensaje de error adecuado.
   * @returns void
   */
  loadOrders(): void {
    this.orderErrorMessage = '';
    this.orderError = false;
    this.ordersService
      .getAllOrders()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((orders) => {
          if (!orders || orders.length === 0) return of([]);
          // prepara la lista de observables de responsables
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
          // Ejecuta todas en paralelo y mapea a cada orden
          return forkJoin(responsibleRequests).pipe(
            map((responsibles) =>
              orders.map((order, i) => ({
                ...order,
                assignee: responsibles[i], // objeto employee o group o null
              })),
            ),
          );
        }),
      )
      .subscribe({
        next: (orders) => {
          this.orders$.next(orders);
          console.log('Órdenes cargadas:', orders);
          this.updateStates(orders);
        },
        error: (err) => {
          console.error('Error al cargar órdenes:', err);
          this.orderErrorMessage =
            'Error al cargar órdenes. Por favor, inténtalo de nuevo.';
          this.orderError = true;
        },
      });
  }

  /**
   * Actualiza las estadísticas de órdenes según su estado.
   * @param orders Lista de órdenes a procesar
   */
  updateStates(orders: Order[]) {
    this.stats.totalOrders = orders.length;
    this.stats.created = orders.filter(
      (o) => o.state === OrderStates.CREATED,
    ).length;
    this.stats.inProgress = orders.filter(
      (o) => o.state === OrderStates.IN_PROGRESS,
    ).length;
    this.stats.dispatched = orders.filter(
      (o) => o.state === OrderStates.DISPATCHED,
    ).length;
    this.stats.finished = orders.filter(
      (o) => o.state === OrderStates.FINISHED,
    ).length;
  }

  /**
   * Calcula el número total de páginas para la paginación según el total de órdenes filtradas y el tamaño de página
   * Utiliza la propiedad totalItems, que se actualiza automáticamente cuando cambia la lista de órdenes filtradas, para calcular el total de páginas
   * @returns number Número total de páginas para la paginación
   */
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  /**
   * Cierra todos los modales y limpia el estado relacionado con la edición y eliminación de dispositivos
   * Resetea los flags de visibilidad de los modales, limpia los dispositivos seleccionados para edición y eliminación, y restablece el estado del formulario
   * @returns void
   */
  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.orderToEdit = null;
    this.orderToDelete = null;
  }

  /**
   * Maneja el resultado del formulario de creación/edición de orden
   * Muestra un toast de éxito, recarga la lista de órdenes y cierra los modales
   * @param result Resultado del formulario que incluye la orden creada/actualizada y el modo de operación (crear o editar)
   * @returns void
   */
  handleModalSave({ order, mode }: OrderFormResult): void {
    toast.success(mode === 'create' ? 'Orden creada' : 'Orden actualizada');
    this.loadOrders();
    this.closeModals();
  }

  /** Limpia el mensaje de error
   * @returns void
   */
  clearError(): void {
    this.orderErrorMessage = '';
  }

  /**
   * Confirma la eliminación de la orden
   * Llama al servicio para eliminar el dispositivo por su ID
   * Muestra un toast de éxito o error según corresponda
   */
  onDeviceDeleted(): void {
    this.showDeleteModal = false;
    this.orderToDelete = null;
    this.loadOrders();
  }

  /**
   * Cancela la eliminación y cierra el modal
   * Emite un evento de cancelación para que el componente padre pueda manejarlo
   * @returns void
   */
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.orderToDelete = null;
  }

  /**
   * Navega a la página de detalle del responsable de la orden (empleado o grupo) según su tipo
   * @param order Orden seleccionada
   */
  verDetalle(order: Order): void {
    console.log('Ver detalle del grupo:', order.assignee);
    switch (order.assigneeType) {
      case 'GROUP':
        this.router.navigate(['/app/groups', order.assignee?.id]);
        break;
      case 'EMPLOYEE':
        this.router.navigate(['/app/employees', order.assignee?.id]);
        break;
      default:
        break;
    }
  }
}
