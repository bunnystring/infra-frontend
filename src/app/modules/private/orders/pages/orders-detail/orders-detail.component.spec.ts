import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrdersDetailComponent } from './orders-detail.component';
import { OrdersService } from '../../services/orders.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { DevicesService } from '../../../devices/services/devices.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { Order, OrderStates, OrderStatusColors } from '../../models/orders.model';
import { Device, DeviceStatus, DeviceStatusLabels, DeviceStatusColors } from '../../../devices/models/device.model';
import { Employee, EmployeeStatus } from '../../../employees/models/employee.model';
import { Group } from '../../../groups/models/groups.model';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockDevice: Device = {
  id: 'dev-1',
  name: 'Laptop HP',
  brand: 'HP',
  barcode: 'HP001',
  status: DeviceStatus.GOOD_CONDITION,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: null,
};

const mockEmployee: Employee = {
  id: 'emp-1',
  fullName: 'Juan Pérez',
  email: 'juan@test.com',
  documentType: 'CC',
  documentNumber: '123456',
  status: EmployeeStatus.ACTIVE,
};

const mockGroup: Group = {
  id: 'group-1',
  name: 'Grupo TI',
  address: 'Calle 1',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: null,
  employees: [mockEmployee],
};

const mockOrder: Order = {
  id: 'abc12345-full-uuid',
  description: 'Instalación de equipos',
  state: OrderStates.CREATED,
  assigneeType: 'EMPLOYEE',
  assigneeId: 'emp-1',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
  items: [{ deviceId: 'dev-1', originalDeviceState: DeviceStatus.GOOD_CONDITION }],
  assignee: null,
};

function buildProviders(
  orderId = 'abc12345-full-uuid',
  orderResult: Order | null = mockOrder,
  assigneeType: 'EMPLOYEE' | 'GROUP' = 'EMPLOYEE',
) {
  const order = orderResult
    ? { ...orderResult, assigneeType }
    : null;

  const ordersServiceSpy = {
    getOrderById: () => (order ? of(order) : throwError(() => ({ error: { message: 'Not found' } }))),
  };
  const devicesServiceSpy = {
    getDevicesBatch: () => of([mockDevice]),
  };
  const employeesServiceSpy = {
    getEmployeeById: () => of(mockEmployee),
  };
  const groupsServiceSpy = {
    getGroupById: () => of(mockGroup),
  };

  return {
    ordersServiceSpy,
    devicesServiceSpy,
    employeesServiceSpy,
    groupsServiceSpy,
    providers: [
      provideRouter([]),
      { provide: OrdersService, useValue: ordersServiceSpy },
      { provide: DevicesService, useValue: devicesServiceSpy },
      { provide: EmployeesService, useValue: employeesServiceSpy },
      { provide: GroupsService, useValue: groupsServiceSpy },
      { provide: LoadingService, useValue: { loading$: of(false) } },
      {
        provide: ActivatedRoute,
        useValue: { params: of({ id: orderId }) },
      },
    ],
  };
}

describe('OrdersDetailComponent', () => {
  let component: OrdersDetailComponent;
  let fixture: ComponentFixture<OrdersDetailComponent>;
  let locationSpy: { back: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(
    orderId = 'abc12345-full-uuid',
    orderResult: Order | null = mockOrder,
    assigneeType: 'EMPLOYEE' | 'GROUP' = 'EMPLOYEE',
  ) {
    locationSpy = { back: vi.fn() };
    const { providers } = buildProviders(orderId, orderResult, assigneeType);

    await TestBed.configureTestingModule({
      imports: [OrdersDetailComponent],
      providers: [
        ...providers,
        { provide: Location, useValue: locationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
    await fixture.whenStable();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── Creación ──────────────────────────────────────────────────────────────
  it('debe ser creado', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ── getShortId ────────────────────────────────────────────────────────────
  describe('getShortId', () => {
    it('retorna los primeros 8 caracteres del UUID', async () => {
      await setup();
      expect(component.getShortId('abc12345-full-uuid')).toBe('abc12345');
    });

    it('retorna el string completo si tiene menos de 8 chars', async () => {
      await setup();
      expect(component.getShortId('ab')).toBe('ab');
    });
  });

  // ── goBack ────────────────────────────────────────────────────────────────
  describe('goBack', () => {
    it('llama a location.back()', async () => {
      await setup();
      component.goBack();
      expect(locationSpy.back).toHaveBeenCalled();
    });
  });

  // ── getDeviceStatusLabel ──────────────────────────────────────────────────
  describe('getDeviceStatusLabel', () => {
    it('retorna la etiqueta correcta para GOOD_CONDITION', async () => {
      await setup();
      expect(component.getDeviceStatusLabel(DeviceStatus.GOOD_CONDITION))
        .toBe(DeviceStatusLabels[DeviceStatus.GOOD_CONDITION]);
    });

    it('retorna la etiqueta correcta para NEEDS_REPAIR', async () => {
      await setup();
      expect(component.getDeviceStatusLabel(DeviceStatus.NEEDS_REPAIR))
        .toBe(DeviceStatusLabels[DeviceStatus.NEEDS_REPAIR]);
    });

    it('retorna "-" para estado null', async () => {
      await setup();
      expect(component.getDeviceStatusLabel(null)).toBe('-');
    });

    it('retorna "-" para estado undefined', async () => {
      await setup();
      expect(component.getDeviceStatusLabel(undefined)).toBe('-');
    });
  });

  // ── getDeviceStatusColor ──────────────────────────────────────────────────
  describe('getDeviceStatusColor', () => {
    it('retorna la clase CSS correcta para GOOD_CONDITION', async () => {
      await setup();
      const expected = 'badge-' + DeviceStatusColors[DeviceStatus.GOOD_CONDITION];
      expect(component.getDeviceStatusColor(DeviceStatus.GOOD_CONDITION)).toBe(expected);
    });

    it('retorna badge-secondary para estado null', async () => {
      await setup();
      expect(component.getDeviceStatusColor(null)).toBe('badge-secondary');
    });
  });

  // ── getOrderStateBadge ────────────────────────────────────────────────────
  describe('getOrderStateBadge', () => {
    it('retorna la clase CSS correcta para CREATED', async () => {
      await setup();
      const badge = component.getOrderStateBadge(OrderStates.CREATED);
      expect(badge).toContain('badge badge-');
      expect(badge).toContain(OrderStatusColors[OrderStates.CREATED]);
    });

    it('retorna badge neutral para estado null', async () => {
      await setup();
      expect(component.getOrderStateBadge(null)).toContain('badge-neutral');
    });
  });

  // ── getOrderStateLabel ────────────────────────────────────────────────────
  describe('getOrderStateLabel', () => {
    it('retorna el estado como string para CREATED', async () => {
      await setup();
      expect(component.getOrderStateLabel(OrderStates.CREATED)).toBe(OrderStates.CREATED);
    });

    it('retorna "-" para estado null', async () => {
      await setup();
      expect(component.getOrderStateLabel(null)).toBe('-');
    });

    it('retorna "-" para estado undefined', async () => {
      await setup();
      expect(component.getOrderStateLabel(undefined)).toBe('-');
    });
  });

  // ── Getters tooltip ───────────────────────────────────────────────────────
  describe('groupNameTooltip', () => {
    it('retorna cadena vacía cuando groupName está vacío', async () => {
      await setup();
      component.groupName.set('');
      expect(component.groupNameTooltip).toBe('');
    });

    it('retorna el tooltip con el nombre del grupo', async () => {
      await setup();
      component.groupName.set('Grupo TI');
      expect(component.groupNameTooltip).toBe('Grupo: Grupo TI');
    });
  });

  describe('employeeNameTooltip', () => {
    it('retorna cadena vacía cuando no hay orden', async () => {
      await setup(undefined, null);
      component.order.set(null);
      expect(component.employeeNameTooltip).toBe('');
    });
  });

  // ── getOrderDetail ────────────────────────────────────────────────────────
  describe('getOrderDetail', () => {
    it('carga la orden correctamente desde la ruta', async () => {
      await setup();
      expect(component.order()).toBeTruthy();
      expect(component.order()?.id).toBe(mockOrder.id);
    });

    it('establece error cuando la orden no existe', async () => {
      await setup('bad-id', null);
      expect(component.error()).toBeTruthy();
      expect(component.order()).toBeNull();
    });

    it('carga dispositivos al obtener la orden con items', async () => {
      await setup();
      expect(component.order()?.items).toBeDefined();
    });
  });

  // ── refreshData ───────────────────────────────────────────────────────────
  describe('refreshData', () => {
    it('recarga los detalles de la orden', async () => {
      await setup();
      const spy = vi.spyOn(component, 'getOrderDetail');
      component.refreshData();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── goAsignedDetail ───────────────────────────────────────────────────────
  describe('goAsignedDetail', () => {
    it('navega al detalle del empleado', async () => {
      await setup('abc12345-full-uuid', mockOrder, 'EMPLOYEE');
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goAsignedDetail();
      expect(navigateSpy).toHaveBeenCalledWith(
        expect.arrayContaining(['/app/employees/'])
      );
    });

    it('navega al detalle del grupo', async () => {
      await setup('abc12345-full-uuid', mockOrder, 'GROUP');
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goAsignedDetail();
      expect(navigateSpy).toHaveBeenCalledWith(
        expect.arrayContaining(['/app/groups/'])
      );
    });

    it('no navega si no hay orden', async () => {
      await setup();
      component.order.set(null);
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goAsignedDetail();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
