import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { OrdersStore } from '../../store/orders.store';
import { LoadingService } from '../../../../../core/services/loading.service';
import { Order, OrderStates, OrderFormResult } from '../../models/orders.model';
import { toast } from 'ngx-sonner';

const mockOrder: Order = {
  id: 'order-1',
  description: 'Instalación de equipos banco',
  state: OrderStates.CREATED,
  assigneeType: 'GROUP',
  assigneeId: 'group-1',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
  items: [],
  assignee: { id: 'group-1', name: 'Grupo Test' },
};

function buildMockStore(orders: Order[] = [], error: string | null = null) {
  return {
    orders: () => orders,
    error: () => error,
    isLoading: () => false,
    loadOrders: () => of([]),
    clearError: () => {},
    upsertOrder: (_order: Order) => {},
    removeOrder: (_id: string) => {},
    stats: () => ({}),
  };
}

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let router: Router;
  let mockStore: ReturnType<typeof buildMockStore>;

  async function setup(orders: Order[] = [], error: string | null = null) {
    mockStore = buildMockStore(orders, error);

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        provideRouter([]),
        { provide: OrdersStore, useValue: mockStore },
        { provide: LoadingService, useValue: { loading$: of(false) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  }

  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });

  it('debe ser creado', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────
  describe('ngOnInit', () => {
    it('muestra toast.error cuando el store tiene error', async () => {
      await setup([], 'Error de red');
      vi.spyOn(toast, 'error');
      await fixture.whenStable();
      await fixture.whenStable();
      expect(toast.error).toHaveBeenCalledWith('No se pudo conectar al microservicio de órdenes.');
    });

    it('muestra toast.info cuando no hay error y lista vacía', async () => {
      await setup([]);
      vi.spyOn(toast, 'info');
      await fixture.whenStable();
      await fixture.whenStable();
      expect(toast.info).toHaveBeenCalledWith('No hay órdenes para mostrar actualmente.');
    });

    it('no muestra toast cuando hay órdenes y sin error', async () => {
      await setup([mockOrder]);
      vi.spyOn(toast, 'info');
      vi.spyOn(toast, 'error');
      await fixture.whenStable();
      await fixture.whenStable();
      expect(toast.info).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  // ── Filtros ───────────────────────────────────────────────────────────────
  describe('filteredOrders', () => {
    const orders: Order[] = [
      { ...mockOrder, id: '1', description: 'Instalación banco', state: OrderStates.CREATED },
      { ...mockOrder, id: '2', description: 'Mantenimiento equipo', state: OrderStates.IN_PROCESS },
      { ...mockOrder, id: '3', description: 'Envío dispositivos', state: OrderStates.FINISHED },
    ];

    beforeEach(async () => {
      await setup(orders);
      await fixture.whenStable();
    });

    it('retorna todas las órdenes sin filtros', () => {
      expect(component.filteredOrders().length).toBe(3);
    });

    it('filtra por término de búsqueda en descripción', () => {
      component.search = 'banco';
      expect(component.filteredOrders().length).toBe(1);
      expect(component.filteredOrders()[0].description).toBe('Instalación banco');
    });

    it('filtra por estado', () => {
      component.statusFilter = OrderStates.FINISHED;
      expect(component.filteredOrders().length).toBe(1);
      expect(component.filteredOrders()[0].state).toBe(OrderStates.FINISHED);
    });

    it('combina búsqueda y estado sin resultados', () => {
      component.search = 'instalación';
      component.statusFilter = OrderStates.IN_PROCESS;
      expect(component.filteredOrders().length).toBe(0);
    });

    it('resetea la página a 1 al cambiar búsqueda', () => {
      component.page = 2;
      component.search = 'test';
      expect(component.page).toBe(1);
    });

    it('resetea la página a 1 al cambiar filtro de estado', () => {
      component.page = 2;
      component.statusFilter = OrderStates.CREATED;
      expect(component.page).toBe(1);
    });
  });

  // ── Paginación ────────────────────────────────────────────────────────────
  describe('paginación', () => {
    beforeEach(async () => {
      const orders: Order[] = Array.from({ length: 25 }, (_, i) => ({
        ...mockOrder,
        id: `order-${i}`,
        description: `Orden ${i}`,
      }));
      await setup(orders);
      await fixture.whenStable();
    });

    it('calcula totalPages correctamente (25 items / 10 = 3)', () => {
      expect(component.totalPages()).toBe(3);
    });

    it('retorna 10 ítems en la primera página', () => {
      expect(component.paginatedOrders().length).toBe(10);
    });

    it('nextPage incrementa la página', () => {
      component.nextPage();
      expect(component.page).toBe(2);
    });

    it('previousPage decrementa la página', () => {
      component.page = 2;
      component.previousPage();
      expect(component.page).toBe(1);
    });

    it('goToPage no navega debajo de la página 1', () => {
      component.goToPage(0);
      expect(component.page).toBe(1);
    });

    it('goToPage no navega más allá de totalPages', () => {
      component.goToPage(999);
      expect(component.page).toBe(1);
    });

    it('totalItems refleja el número de órdenes filtradas', () => {
      expect(component.totalItems()).toBe(25);
    });
  });

  // ── Modales ───────────────────────────────────────────────────────────────
  describe('closeModals', () => {
    it('resetea todos los estados de modal y referencias de orden', async () => {
      await setup();
      component.showCreateModal = true;
      component.showEditModal = true;
      component.showDeleteModal = true;
      component.orderToEdit = mockOrder;
      component.orderToDelete = mockOrder;
      component.closeModals();
      expect(component.showCreateModal).toBe(false);
      expect(component.showEditModal).toBe(false);
      expect(component.showDeleteModal).toBe(false);
      expect(component.orderToEdit).toBeNull();
      expect(component.orderToDelete).toBeNull();
    });
  });

  describe('handleModalSave', () => {
    beforeEach(async () => await setup());

    it('muestra "Orden creada" y recarga en modo create', () => {
      vi.spyOn(component, 'loadOrders');
      vi.spyOn(component, 'closeModals');
      vi.spyOn(toast, 'success');
      component.handleModalSave({ order: mockOrder, mode: 'create' } as OrderFormResult);
      expect(toast.success).toHaveBeenCalledWith('Orden creada');
      expect(component.loadOrders).toHaveBeenCalled();
      expect(component.closeModals).toHaveBeenCalled();
    });

    it('muestra "Orden actualizada" en modo edit', () => {
      vi.spyOn(component, 'loadOrders');
      vi.spyOn(component, 'closeModals');
      vi.spyOn(toast, 'success');
      component.handleModalSave({ order: mockOrder, mode: 'edit' } as OrderFormResult);
      expect(toast.success).toHaveBeenCalledWith('Orden actualizada');
    });
  });

  describe('onOrderDeleted', () => {
    it('resetea el estado de eliminación y recarga', async () => {
      await setup();
      const loadSpy = vi.spyOn(component, 'loadOrders');
      component.showDeleteModal = true;
      component.orderToDelete = mockOrder;
      component.onOrderDeleted();
      expect(component.showDeleteModal).toBe(false);
      expect(component.orderToDelete).toBeNull();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('cancelDelete', () => {
    it('cierra el modal sin recargar órdenes', async () => {
      await setup();
      const loadSpy = vi.spyOn(component, 'loadOrders');
      component.showDeleteModal = true;
      component.orderToDelete = mockOrder;
      component.cancelDelete();
      expect(component.showDeleteModal).toBe(false);
      expect(component.orderToDelete).toBeNull();
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('delega a store.clearError()', async () => {
      await setup();
      const clearSpy = vi.spyOn(mockStore, 'clearError');
      component.clearError();
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  // ── Navegación ────────────────────────────────────────────────────────────
  describe('goToAssignee', () => {
    beforeEach(async () => await setup());

    it('navega al detalle del grupo', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const order: Order = { ...mockOrder, assigneeType: 'GROUP', assignee: { id: 'group-1' } };
      component.goToAssignee(order);
      expect(navigateSpy).toHaveBeenCalledWith(['/app/groups', 'group-1']);
    });

    it('navega al detalle del empleado', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const order: Order = { ...mockOrder, assigneeType: 'EMPLOYEE', assignee: { id: 'emp-1' } };
      component.goToAssignee(order);
      expect(navigateSpy).toHaveBeenCalledWith(['/app/employees', 'emp-1']);
    });
  });

  describe('goDetailOrder', () => {
    beforeEach(async () => await setup());

    it('navega al detalle de la orden con ID válido', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goDetailOrder('order-123');
      expect(navigateSpy).toHaveBeenCalledWith(['/app/orders/', 'order-123']);
    });

    it('no navega si el ID está vacío', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goDetailOrder('');
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ── Estadísticas ──────────────────────────────────────────────────────────
  describe('getStates', () => {
    beforeEach(async () => await setup());

    it('calcula estadísticas para lista mixta', () => {
      const orders: Order[] = [
        { ...mockOrder, state: OrderStates.CREATED },
        { ...mockOrder, state: OrderStates.CREATED },
        { ...mockOrder, state: OrderStates.IN_PROCESS },
        { ...mockOrder, state: OrderStates.DISPATCHED },
        { ...mockOrder, state: OrderStates.FINISHED },
      ];
      const stats = component.getStates(orders);
      expect(stats.totalOrders).toBe(5);
      expect(stats.created).toBe(2);
      expect(stats.inProcess).toBe(1);
      expect(stats.dispatched).toBe(1);
      expect(stats.finished).toBe(1);
    });

    it('retorna ceros con lista vacía', () => {
      const stats = component.getStates([]);
      expect(stats.totalOrders).toBe(0);
      expect(stats.created).toBe(0);
    });
  });

  // ── Getters de estado ─────────────────────────────────────────────────────
  describe('orderError y buttonsIsAvailable', () => {
    it('orderError es true cuando hay error', async () => {
      await setup([], 'Error');
      expect(component.orderError).toBe(true);
    });

    it('orderError es false cuando no hay error', async () => {
      await setup([], null);
      expect(component.orderError).toBe(false);
    });

    it('buttonsIsAvailable es false cuando hay error', async () => {
      await setup([], 'Error');
      expect(component.buttonsIsAvailable).toBe(false);
    });

    it('buttonsIsAvailable es true cuando no hay error', async () => {
      await setup([], null);
      expect(component.buttonsIsAvailable).toBe(true);
    });
  });
});
