import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
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

  // ── Filter & pagination state as signals ─────────────────────────────────
  private readonly _search = signal('');
  private readonly _statusFilter = signal<OrderStates | 'ALL'>('ALL');
  private readonly _page = signal(1);
  private readonly _pageSize = signal(10);

  // Getter/setter pairs for ngModel and direct template assignment
  get search() { return this._search(); }
  set search(v: string) { this._search.set(v); this._page.set(1); }

  get statusFilter() { return this._statusFilter(); }
  set statusFilter(v: OrderStates | 'ALL') { this._statusFilter.set(v); this._page.set(1); }

  get page() { return this._page(); }
  set page(v: number) { this._page.set(v); }

  get pageSize() { return this._pageSize(); }
  set pageSize(v: number) { this._pageSize.set(v); }

  // ── Derived state as computed (memoized) ─────────────────────────────────
  readonly filteredOrders = computed(() => {
    const s = this._search().toLowerCase();
    const f = this._statusFilter();
    return this.store.orders().filter(
      (o) => this.matchSearch(o, s) && (f === 'ALL' || o.state === f),
    );
  });

  readonly ordersStats = computed(() => this.getStates(this.filteredOrders()));

  readonly totalItems = computed(() => this.filteredOrders().length);

  readonly paginatedOrders = computed(() => {
    const p = this._page();
    const ps = this._pageSize();
    return this.filteredOrders().slice((p - 1) * ps, p * ps);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredOrders().length / this._pageSize()) || 1,
  );

  // Error state derived from store — no effect, no state propagation
  get orderError() { return !!this.store.error(); }
  get buttonsIsAvailable() { return !this.store.error(); }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit() {
    if (this.store.error()) {
      toast.error('No se pudo conectar al microservicio de órdenes.');
    } else if (this.store.orders().length === 0) {
      toast.info('No hay órdenes para mostrar actualmente.');
    }
  }

  // ── Public methods ───────────────────────────────────────────────────────
  loadOrders(): void {
    this.store.loadOrders().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  getStates(orders: Order[]) {
    return {
      totalOrders: orders.length,
      created: orders.filter((o) => o.state === OrderStates.CREATED).length,
      inProcess: orders.filter((o) => o.state === OrderStates.IN_PROCESS).length,
      dispatched: orders.filter((o) => o.state === OrderStates.DISPATCHED).length,
      finished: orders.filter((o) => o.state === OrderStates.FINISHED).length,
    };
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.orderToEdit = null;
    this.orderToDelete = null;
  }

  handleModalSave({ mode }: OrderFormResult): void {
    toast.success(mode === 'create' ? 'Orden creada' : 'Orden actualizada');
    this.loadOrders();
    this.closeModals();
  }

  clearError(): void {
    this.store.clearError();
  }

  onOrderDeleted(): void {
    this.showDeleteModal = false;
    this.orderToDelete = null;
    this.loadOrders();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.orderToDelete = null;
  }

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

  goDetailOrder(orderId: string): void {
    if (!orderId) return;
    this.router.navigate(['/app/orders/', orderId]);
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this._page.set(pageNumber);
    }
  }

  nextPage(): void { this.goToPage(this.page + 1); }
  previousPage(): void { this.goToPage(this.page - 1); }

  private matchSearch(order: Order, search: string): boolean {
    if (!search) return true;
    return (
      order.description.toLowerCase().includes(search) ||
      order.assigneeType.toLowerCase().includes(search) ||
      order.state.toLowerCase().includes(search)
    );
  }
}
