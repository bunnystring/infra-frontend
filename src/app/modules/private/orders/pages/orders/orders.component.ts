import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import {
  Order,
  OrderStates,
  OrderStateLabels,
  OrderStatusColors,
  OrderFormResult,
} from '../../models/Orders';
import { LoadingService } from '../../../../../core/services/loading.service';
import { OrderCreateEditModalComponent } from '../../modals/order-create-edit-modal/order-create-edit-modal.component';
import { OrderDeleteModalComponent } from '../../modals/order-delete-modal/order-delete-modal.component';
import { OrdersStore } from '../../store/orders.store';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, OrderCreateEditModalComponent, OrderDeleteModalComponent],
})
export class OrdersComponent implements OnInit {
  private readonly store = inject(OrdersStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = toSignal(inject(LoadingService).loading$, { initialValue: false });

  // Template enums
  readonly OrderStates = OrderStates;
  readonly OrderStateLabels = OrderStateLabels;
  readonly OrderStatusColors = OrderStatusColors;

  // Modal state (ephemeral UI — plain properties are fine)
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  orderToEdit: Order | null = null;
  orderToDelete: Order | null = null;

  // Signals para filtros y paginación
  private readonly _search = signal('');
  private readonly _statusFilter = signal<OrderStates | 'ALL'>('ALL');
  private readonly _page = signal(1);
  private readonly _pageSize = signal(10);

  // Getters y setters para filtros y paginación, que actualizan la señal correspondiente y reinician la página cuando es necesario
  get search() { return this._search(); }
  set search(v: string) { this._search.set(v); this._page.set(1); }

  get statusFilter() { return this._statusFilter(); }
  set statusFilter(v: OrderStates | 'ALL') { this._statusFilter.set(v); this._page.set(1); }

  get page() { return this._page(); }
  set page(v: number) { this._page.set(v); }

  get pageSize() { return this._pageSize(); }
  set pageSize(v: number) { this._pageSize.set(v); }

  // Órdenes filtradas y paginadas, calculadas a partir de las señales de búsqueda, filtro de estado, página y tamaño de página
  readonly filteredOrders = computed(() => {
    const s = this._search().toLowerCase();
    const f = this._statusFilter();
    return this.store.orders().filter(
      (o) => this.matchSearch(o, s) && (f === 'ALL' || o.state === f),
    );
  });

  // Estadísticas de órdenes calculadas a partir de las órdenes filtradas
  readonly ordersStats = computed(() => this.getStates(this.filteredOrders()));

  // Total de órdenes después de aplicar filtros, para paginación
  readonly totalItems = computed(() => this.filteredOrders().length);

  // Órdenes paginadas, calculadas a partir de las órdenes filtradas y la página actual
  readonly paginatedOrders = computed(() => {
    const p = this._page();
    const ps = this._pageSize();
    return this.filteredOrders().slice((p - 1) * ps, p * ps);
  });

  // Total de páginas calculado a partir del total de órdenes filtradas y el tamaño de página
  readonly totalPages = computed(() =>
    Math.ceil(this.filteredOrders().length / this._pageSize()) || 1,
  );

  // Getters para estado de error y disponibilidad de botones, basados en el estado del store
  get orderError() { return !!this.store.error(); }
  get buttonsIsAvailable() { return !this.store.error(); }

  /**
   * Ciclo de vida del componente: al inicializar, verifica si hay un error en el store y muestra un toast de error si es así. Si no hay error pero tampoco hay órdenes, muestra un toast informativo indicando que no hay órdenes para mostrar. No carga las órdenes aquí porque se asume que ya fueron cargadas por el store al inicializarse, y este componente simplemente reacciona a los cambios en el estado del store.
   * @returns void
   */
  ngOnInit() {
    if (this.store.error()) {
      toast.error('No se pudo conectar al microservicio de órdenes.');
    } else if (this.store.orders().length === 0) {
      toast.info('No hay órdenes para mostrar actualmente.');
    }
  }

  /**
   * Carga las órdenes desde el store, suscribiéndose a los cambios y asegurándose de limpiar la suscripción al destruir el componente para evitar fugas de memoria. Este método se puede llamar después de crear, editar o eliminar una orden para recargar la lista actualizada de órdenes.
   * @returns void
   */
  loadOrders(): void {
    this.store.loadOrders().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /**
   * Obtiene un resumen de los estados de las órdenes, contando cuántas órdenes hay en total y cuántas hay en cada estado específico. Esto se utiliza para mostrar estadísticas rápidas sobre el estado de las órdenes en la interfaz de usuario.
   * @param orders Lista de órdenes para calcular las estadísticas
   * @returns Un objeto con el total de órdenes y el conteo de cada estado específico
   */
  getStates(orders: Order[]) {
    return {
      totalOrders: orders.length,
      created: orders.filter((o) => o.state === OrderStates.CREATED).length,
      inProcess: orders.filter((o) => o.state === OrderStates.IN_PROCESS).length,
      dispatched: orders.filter((o) => o.state === OrderStates.DISPATCHED).length,
      finished: orders.filter((o) => o.state === OrderStates.FINISHED).length,
    };
  }

  /**
   * Cierra todos los modales de creación, edición y eliminación, y resetea las órdenes seleccionadas para edición o eliminación. Esto se llama después de guardar una orden o cancelar una acción para asegurarse de que el estado del modal se restablezca correctamente.
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
   * Maneja el modal de creación o edición de una orden, mostrando un toast de éxito y recargando las órdenes después de guardar. Este método se llama cuando el modal de creación o edición emite un evento de guardado, indicando que se ha creado o actualizado una orden. El método muestra un mensaje de éxito correspondiente al modo (creación o edición), recarga la lista de órdenes para reflejar los cambios y cierra los modales.
   * @param param Objeto con el resultado del formulario, incluyendo la orden creada o editada y el modo de operación (crear o editar)
   * @returns void
   */
  handleModalSave({ mode }: OrderFormResult): void {
    toast.success(mode === 'create' ? 'Orden creada' : 'Orden actualizada');
    this.loadOrders();
    this.closeModals();
  }

  /**
   * Limpia el error del store, lo que puede ser útil para permitir al usuario intentar cargar las órdenes nuevamente después de un error. Este método se llama cuando el usuario hace clic en un botón para limpiar el error, y simplemente delega la acción al store para que actualice su estado de error a vacío o nulo.
   * @returns void
   */
  clearError(): void {
    this.store.clearError();
  }

  /**
   * Maneja la eliminación de una orden, mostrando un toast de éxito y recargando las órdenes después de eliminar. Este método se llama cuando el modal de eliminación emite un evento de eliminación, indicando que se ha eliminado una orden. El método muestra un mensaje de éxito, recarga la lista de órdenes para reflejar la eliminación y cierra los modales.
   * @returns void
   */
  onOrderDeleted(): void {
    this.showDeleteModal = false;
    this.orderToDelete = null;
    this.loadOrders();
  }

  /**
   * Cancela la eliminación de una orden, cerrando el modal de eliminación y reseteando la orden seleccionada para eliminación. Este método se llama cuando el usuario decide cancelar la acción de eliminación desde el modal, y simplemente restablece el estado del modal y la orden a eliminar sin realizar ninguna acción adicional.
   * @returns void
   */
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.orderToDelete = null;
  }

  /**
   * Navega a la página de detalles del asignado de una orden, ya sea un grupo o un empleado, dependiendo del tipo de asignado. Este método se llama cuando el usuario hace clic en el badge del asignado en la lista de órdenes, y utiliza el router para navegar a la página correspondiente según el tipo de asignado (grupo o empleado) y su ID.
   * @param order La orden para la cual se desea ver el detalle del asignado
   * @returns void
   */
  goToAssignee(order: Order): void {
    switch (order.assigneeType) {
      case 'GROUP':
        this.router.navigate(['/app/groups', order.assignee?.id]);
        break;
      case 'EMPLOYEE':
        this.router.navigate(['/app/employees', order.assignee?.id]);
        break;
    }
  }

  /**
   * Navega a la página de detalles de una orden específica, utilizando el router para dirigir al usuario a la ruta correspondiente con el ID de la orden. Este método se llama cuando el usuario hace clic en una orden en la lista, y utiliza el router para navegar a la página de detalles de esa orden.
   * @param orderId El ID de la orden para la cual se desea ver el detalle
   * @returns void
   */
  goDetailOrder(orderId: string): void {
    if (!orderId) return;
    this.router.navigate(['/app/orders/', orderId]);
  }

  /**
   * Navega a una página específica de la lista de órdenes, actualizando el estado de la página actual en el store. Este método se llama cuando el usuario desea cambiar de página en la paginación.
   * @param pageNumber El número de página al que se desea navegar
   * @returns void
   */
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this._page.set(pageNumber);
    }
  }

  /**
   * Navega a la página siguiente de la lista de órdenes, incrementando el número de página actual. Este método se llama cuando el usuario hace clic en el botón de página siguiente en la paginación, y simplemente incrementa el número de página actual para mostrar la siguiente página de órdenes.
   * @returns void
   */
  nextPage(): void { this.goToPage(this.page + 1); }
  
  /**
   * Navega a la página anterior de la lista de órdenes, decrementando el número de página actual. Este método se llama cuando el usuario hace clic en el botón de página anterior en la paginación, y simplemente decrementa el número de página actual para mostrar la página anterior de órdenes.
   * @returns void
   */
  previousPage(): void { this.goToPage(this.page - 1); }

  /**
   * Verifica si una orden coincide con el término de búsqueda proporcionado. Este método se utiliza para filtrar las órdenes en función de la descripción, el tipo de asignado y el estado.
   * @param order La orden que se desea verificar
   * @param search El término de búsqueda
   * @returns boolean Indica si la orden coincide con el término de búsqueda
   */
  private matchSearch(order: Order, search: string): boolean {
    if (!search) return true;
    return (
      order.description.toLowerCase().includes(search) ||
      order.assigneeType.toLowerCase().includes(search) ||
      order.state.toLowerCase().includes(search)
    );
  }
}
