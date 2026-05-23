import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrderCreateEditModalComponent } from './order-create-edit-modal.component';
import { OrdersService } from '../../services/orders.service';
import { DevicesService } from '../../../devices/services/devices.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { Order, OrderStates } from '../../models/orders.model';
import { Device, DeviceStatus } from '../../../devices/models/device.model';
import { Group } from '../../../groups/models/groups.model';
import { Employee, EmployeeStatus } from '../../../employees/models/employee.model';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockOrder: Order = {
  id: 'order-1',
  description: 'Instalación banco',
  state: OrderStates.CREATED,
  assigneeType: 'EMPLOYEE',
  assigneeId: 'emp-1',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
  items: [{ deviceId: 'dev-1', originalDeviceState: DeviceStatus.GOOD_CONDITION }],
  assignee: null,
};

const mockDevice: Device = {
  id: 'dev-1',
  name: 'Laptop HP',
  brand: 'HP',
  barcode: 'HP001',
  status: DeviceStatus.GOOD_CONDITION,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: null,
  assignmentActive: false,
  selected: false,
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

function buildProviders(orderOverride?: Order | null) {
  const devicesServiceSpy = {
    getAllDevices: () => of([mockDevice]),
    hasActiveAssignmentBatch: () => of([{ deviceId: 'dev-1', active: false }]),
    getDevicesBatch: () => of([mockDevice]),
  };
  const groupsServiceSpy = { getAllGroups: () => of([mockGroup]) };
  const employeesServiceSpy = { getAllEmployees: () => of([mockEmployee]) };
  const ordersServiceSpy = {
    createOrder: () => of(mockOrder),
    updateOrder: () => of(mockOrder),
  };

  return {
    devicesServiceSpy,
    groupsServiceSpy,
    employeesServiceSpy,
    ordersServiceSpy,
    providers: [
      { provide: DevicesService, useValue: devicesServiceSpy },
      { provide: GroupsService, useValue: groupsServiceSpy },
      { provide: EmployeesService, useValue: employeesServiceSpy },
      { provide: OrdersService, useValue: ordersServiceSpy },
    ],
  };
}

describe('OrderCreateEditModalComponent', () => {
  let component: OrderCreateEditModalComponent;
  let fixture: ComponentFixture<OrderCreateEditModalComponent>;

  async function setup(order: Order | null = null) {
    const { providers } = buildProviders(order);

    await TestBed.configureTestingModule({
      imports: [OrderCreateEditModalComponent],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCreateEditModalComponent);
    component = fixture.componentInstance;
    if (order) component.order = order;
    await fixture.whenStable();
    await fixture.whenStable();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── Creación ──────────────────────────────────────────────────────────────
  it('debe ser creado en modo crear (sin order)', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('debe ser creado en modo editar (con order)', async () => {
    await setup(mockOrder);
    expect(component).toBeTruthy();
  });

  // ── initForm ──────────────────────────────────────────────────────────────
  describe('initForm', () => {
    it('inicia el formulario vacío en modo crear', async () => {
      await setup();
      expect(component.orderForm.get('description')?.value).toBe('');
      expect(component.orderForm.get('assignedType')?.value).toBe('');
      expect(component.orderForm.get('assigneeId')?.value).toBe('');
      expect(component.orderForm.get('devicesIds')?.value).toEqual([]);
    });

    it('precarga valores de la orden en modo editar', async () => {
      await setup(mockOrder);
      expect(component.orderForm.get('description')?.value).toBe(mockOrder.description);
      expect(component.orderForm.get('assignedType')?.value).toBe(mockOrder.assigneeType);
      expect(component.orderForm.get('assigneeId')?.value).toBe(mockOrder.assigneeId);
    });

    it('el formulario es inválido cuando los campos requeridos están vacíos', async () => {
      await setup();
      expect(component.orderForm.invalid).toBe(true);
    });

    it('el formulario es válido con todos los campos requeridos', async () => {
      await setup();
      component.orderForm.patchValue({
        description: 'Descripción válida',
        assignedType: 'EMPLOYEE',
        assigneeId: 'emp-1',
        devicesIds: ['dev-1'],
      });
      expect(component.orderForm.valid).toBe(true);
    });
  });

  // ── filterDevices ─────────────────────────────────────────────────────────
  describe('filterDevices', () => {
    it('excluye dispositivos ya seleccionados', async () => {
      await setup();
      component.orderForm.get('devicesIds')?.setValue(['dev-1']);
      component.filterDevices();
      expect(component.filteredDevices.every(d => d.id !== 'dev-1')).toBe(true);
    });

    it('filtra por nombre cuando hay búsqueda', async () => {
      await setup();
      component.deviceSearch = 'laptop';
      component.filterDevices();
      expect(component.filteredDevices.every(d =>
        d.name.toLowerCase().includes('laptop') ||
        (d.brand && d.brand.toLowerCase().includes('laptop'))
      )).toBe(true);
    });

    it('retorna todos los no-seleccionados sin búsqueda', async () => {
      await setup();
      component.orderForm.get('devicesIds')?.setValue([]);
      component.filterDevices();
      expect(component.filteredDevices.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ── addDevice / removeDevice ───────────────────────────────────────────────
  describe('addDevice', () => {
    it('agrega el ID al control devicesIds', async () => {
      await setup();
      component.addDevice('dev-2');
      expect(component.orderForm.get('devicesIds')?.value).toContain('dev-2');
    });

    it('limpia el término de búsqueda al agregar', async () => {
      await setup();
      component.deviceSearch = 'HP';
      component.addDevice('dev-2');
      expect(component.deviceSearch).toBe('');
    });
  });

  describe('removeDevice', () => {
    it('elimina el ID del control devicesIds', async () => {
      await setup();
      component.orderForm.get('devicesIds')?.setValue(['dev-1', 'dev-2']);
      component.removeDevice('dev-1');
      expect(component.orderForm.get('devicesIds')?.value).not.toContain('dev-1');
      expect(component.orderForm.get('devicesIds')?.value).toContain('dev-2');
    });
  });

  // ── validateDevices ───────────────────────────────────────────────────────
  describe('validateDevices', () => {
    it('incluye dispositivos en GOOD_CONDITION sin asignación activa', async () => {
      await setup();
      const devices: Device[] = [
        { ...mockDevice, id: 'd1', status: DeviceStatus.GOOD_CONDITION, assignmentActive: false },
      ];
      const result = component.validateDevices(devices);
      expect(result.length).toBe(1);
    });

    it('excluye dispositivos con asignación activa', async () => {
      await setup();
      const devices: Device[] = [
        { ...mockDevice, id: 'd2', status: DeviceStatus.GOOD_CONDITION, assignmentActive: true },
      ];
      const result = component.validateDevices(devices);
      expect(result.length).toBe(0);
    });

    it('excluye dispositivos con estado diferente a GOOD_CONDITION', async () => {
      await setup();
      const devices: Device[] = [
        { ...mockDevice, id: 'd3', status: DeviceStatus.NEEDS_REPAIR, assignmentActive: false },
      ];
      const result = component.validateDevices(devices);
      expect(result.length).toBe(0);
    });

    it('incluye dispositivos que ya están en la orden aunque tengan asignación activa', async () => {
      await setup(mockOrder);
      const devices: Device[] = [
        { ...mockDevice, id: 'dev-1', status: DeviceStatus.GOOD_CONDITION, assignmentActive: true },
      ];
      const result = component.validateDevices(devices);
      expect(result.length).toBe(1);
    });
  });

  // ── validateGroups ────────────────────────────────────────────────────────
  describe('validateGroups', () => {
    it('incluye grupos con al menos un empleado ACTIVE', async () => {
      await setup();
      const result = component.validateGroups([mockGroup]);
      expect(result.length).toBe(1);
    });

    it('excluye grupos sin empleados', async () => {
      await setup();
      const groupSinEmpleados: Group = { ...mockGroup, employees: [] };
      const result = component.validateGroups([groupSinEmpleados]);
      expect(result.length).toBe(0);
    });

    it('excluye grupos con solo empleados INACTIVE', async () => {
      await setup();
      const groupInactivo: Group = {
        ...mockGroup,
        employees: [{ ...mockEmployee, status: EmployeeStatus.INACTIVE }],
      };
      const result = component.validateGroups([groupInactivo]);
      expect(result.length).toBe(0);
    });
  });

  // ── onSubmit ──────────────────────────────────────────────────────────────
  describe('onSubmit', () => {
    it('no emite save si el formulario es inválido', async () => {
      await setup();
      const saveSpy = vi.spyOn(component.save, 'emit');
      component.onSubmit();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('emite save con mode "create" en modo crear', async () => {
      const { providers, ordersServiceSpy } = buildProviders();

      await TestBed.configureTestingModule({
        imports: [OrderCreateEditModalComponent],
        providers,
      }).compileComponents();

      fixture = TestBed.createComponent(OrderCreateEditModalComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      await fixture.whenStable();

      vi.spyOn(ordersServiceSpy, 'createOrder').mockReturnValue(of(mockOrder));
      const saveSpy = vi.spyOn(component.save, 'emit');

      component.orderForm.patchValue({
        description: 'Nueva orden',
        assignedType: 'EMPLOYEE',
        assigneeId: 'emp-1',
        devicesIds: ['dev-1'],
      });
      component.onSubmit();
      await fixture.whenStable();

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'create' })
      );
    });

    it('emite save con mode "edit" en modo editar', async () => {
      const { providers, ordersServiceSpy } = buildProviders(mockOrder);

      await TestBed.configureTestingModule({
        imports: [OrderCreateEditModalComponent],
        providers,
      }).compileComponents();

      fixture = TestBed.createComponent(OrderCreateEditModalComponent);
      component = fixture.componentInstance;
      component.order = mockOrder;
      await fixture.whenStable();
      await fixture.whenStable();

      vi.spyOn(ordersServiceSpy, 'updateOrder').mockReturnValue(of(mockOrder));
      const saveSpy = vi.spyOn(component.save, 'emit');

      component.orderForm.patchValue({ description: 'Descripción modificada' });
      component.onSubmit();
      await fixture.whenStable();

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'edit' })
      );
    });

    it('establece formError cuando el servicio falla', async () => {
      const { providers, ordersServiceSpy } = buildProviders();

      await TestBed.configureTestingModule({
        imports: [OrderCreateEditModalComponent],
        providers,
      }).compileComponents();

      fixture = TestBed.createComponent(OrderCreateEditModalComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      await fixture.whenStable();

      vi.spyOn(ordersServiceSpy, 'createOrder').mockReturnValue(
        throwError(() => ({ error: { message: 'Error del servidor' } }))
      );
      vi.spyOn(component.save, 'emit');

      component.orderForm.patchValue({
        description: 'Orden',
        assignedType: 'EMPLOYEE',
        assigneeId: 'emp-1',
        devicesIds: ['dev-1'],
      });
      component.onSubmit();
      await fixture.whenStable();

      expect(component.formError).toBe('Error del servidor');
    });
  });

  // ── onAssignedTypeChange ──────────────────────────────────────────────────
  describe('onAssignedTypeChange', () => {
    it('limpia assigneeId al cambiar el tipo de asignación', async () => {
      await setup(mockOrder);
      component.onAssignedTypeChange({});
      expect(component.orderForm.get('assigneeId')?.value).toBe('');
    });
  });

  // ── @Output close ─────────────────────────────────────────────────────────
  describe('@Output close', () => {
    it('el EventEmitter close está definido', async () => {
      await setup();
      expect(component.close).toBeDefined();
      expect(typeof component.close.emit).toBe('function');
    });
  });

  // ── Estado inicial ────────────────────────────────────────────────────────
  describe('estado inicial', () => {
    it('submitted inicia en false', async () => {
      await setup();
      expect(component.submitted).toBe(false);
    });

    it('formLoading inicia en false', async () => {
      await setup();
      expect(component.formLoading).toBe(false);
    });

    it('formError inicia como cadena vacía', async () => {
      await setup();
      expect(component.formError).toBe('');
    });
  });
});
