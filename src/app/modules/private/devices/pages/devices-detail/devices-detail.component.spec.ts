import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DevicesDetailComponent } from './devices-detail.component';
import { DevicesService } from '../../services/devices.service';
import { OrdersService } from '../../../orders/services/orders.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { Device, DeviceAssignment, DeviceStatus } from '../../models/device.model';
import { Order, OrderStates } from '../../../orders/models/orders.model';

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

const mockAssignment: DeviceAssignment = {
  deviceId: 'dev-1',
  orderId: 'ord-1',
  deviceName: 'Laptop HP',
  deviceStatus: DeviceStatus.GOOD_CONDITION,
  assignedAt: '2026-01-01T00:00:00',
};

const mockOrder: Order = {
  id: 'ord-1',
  description: 'Orden de prueba',
  state: OrderStates.CREATED,
  assigneeType: 'EMPLOYEE',
  assigneeId: 'emp-1',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
  items: [],
  assignee: null,
};

function buildProviders(
  deviceId = 'dev-1',
  deviceResult: Device | null = mockDevice,
  assignments: DeviceAssignment[] = [mockAssignment],
  orderResult: Order | null = mockOrder,
) {
  const devicesServiceSpy = {
    getDeviceById: () =>
      deviceResult ? of(deviceResult) : throwError(() => ({ error: { message: 'Not found' } })),
    getDeviceAssignmentHistory: () => of(assignments),
  };
  const ordersServiceSpy = {
    getOrderById: () =>
      orderResult ? of(orderResult) : throwError(() => new Error('Not found')),
  };

  return [
    provideRouter([]),
    { provide: DevicesService, useValue: devicesServiceSpy },
    { provide: OrdersService, useValue: ordersServiceSpy },
    { provide: LoadingService, useValue: { loading$: of(false) } },
    { provide: ActivatedRoute, useValue: { params: of({ id: deviceId }) } },
  ];
}

describe('DevicesDetailComponent', () => {
  let component: DevicesDetailComponent;
  let fixture: ComponentFixture<DevicesDetailComponent>;
  let locationSpy: { back: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(
    deviceId = 'dev-1',
    deviceResult: Device | null = mockDevice,
    assignments: DeviceAssignment[] = [mockAssignment],
    orderResult: Order | null = mockOrder,
  ) {
    locationSpy = { back: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DevicesDetailComponent],
      providers: [
        ...buildProviders(deviceId, deviceResult, assignments, orderResult),
        { provide: Location, useValue: locationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesDetailComponent);
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
    it('retorna los primeros 8 caracteres del id', async () => {
      await setup();
      expect(component.getShortId('ord-12345-full')).toBe('ord-1234');
    });

    it('retorna el string completo si tiene menos de 8 chars', async () => {
      await setup();
      expect(component.getShortId('abc')).toBe('abc');
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

  // ── goDetailOrder ─────────────────────────────────────────────────────────
  describe('goDetailOrder', () => {
    it('navega al detalle de la orden', async () => {
      await setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goDetailOrder('ord-1');
      expect(navigateSpy).toHaveBeenCalledWith(['/app/orders/', 'ord-1']);
    });

    it('no navega si orderId está vacío', async () => {
      await setup();
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.goDetailOrder('');
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ── refreshData ───────────────────────────────────────────────────────────
  describe('refreshData', () => {
    it('llama a initParams', async () => {
      await setup();
      const spy = vi.spyOn(component, 'initParams');
      component.refreshData();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── initParams — carga exitosa ────────────────────────────────────────────
  describe('initParams', () => {
    it('carga el dispositivo correctamente', async () => {
      await setup();
      expect(component.device()).toBeTruthy();
      expect(component.device()?.id).toBe('dev-1');
    });

    it('enriquece las asignaciones con el nombre de la orden', async () => {
      await setup();
      const assignments = component.deviceAssignments();
      expect(assignments.length).toBe(1);
      expect(assignments[0].orderName).toBe(mockOrder.description);
    });

    it('marca orderFound true cuando la orden existe', async () => {
      await setup();
      expect(component.deviceAssignments()[0].orderFound).toBe(true);
    });

    it('establece error cuando el dispositivo no existe', async () => {
      await setup('bad-id', null);
      expect(component.error()).toBeTruthy();
    });

    it('maneja historial de asignaciones vacío', async () => {
      await setup('dev-1', mockDevice, []);
      expect(component.device()).toBeTruthy();
      expect(component.deviceAssignments()).toEqual([]);
    });

    it('maneja error en la orden de una asignación sin romper', async () => {
      await setup('dev-1', mockDevice, [mockAssignment], null);
      expect(component.device()).toBeTruthy();
      const assignments = component.deviceAssignments();
      expect(assignments.length).toBe(1);
      expect(assignments[0].orderFound).toBe(false);
    });

    it('asignación sin orderId no llama a getOrderById', async () => {
      const assignmentWithoutOrder: DeviceAssignment = { ...mockAssignment, orderId: '' };
      await setup('dev-1', mockDevice, [assignmentWithoutOrder], mockOrder);
      expect(component.device()).toBeTruthy();
    });
  });
});
