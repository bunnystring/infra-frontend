import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, of, map, firstValueFrom } from 'rxjs';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { Device, DevicesBatchRq, DeviceStatus } from '../../../devices/models/device.model';
import { DevicesService } from '../../../devices/services/devices.service';
import { Employee, EmployeeStatus } from '../../../employees/models/employee.model';
import { Group } from '../../../groups/models/groups.model';
import { GroupsService } from '../../../groups/services/groups.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { OrdersService } from '../../services/orders.service';
import {
  CreateOrderRequest,
  Order,
  OrderFormResult,
  OrderStateLabels,
  OrderStates,
} from '../../models/orders.model';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-order-create-edit-modal',
  templateUrl: './order-create-edit-modal.component.html',
  styleUrls: ['./order-create-edit-modal.component.css'],
  imports: [FormField],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCreateEditModalComponent implements OnInit {
  private readonly devicesService = inject(DevicesService);
  private readonly groupsService = inject(GroupsService);
  private readonly employeesService = inject(EmployeesService);
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = input<Order | null>(null);
  readonly close = output<void>();
  readonly save = output<OrderFormResult>();

  readonly formLoading = signal(false);
  readonly formError = signal('');

  readonly OrderStates = OrderStates;
  readonly OrderStatesLabels = OrderStateLabels;

  readonly assignedType = [
    { label: 'Empleado', value: 'EMPLOYEE' },
    { label: 'Grupo', value: 'GROUP' },
  ];

  readonly devices = signal<Device[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly showDeviceDropdown = signal(false);
  readonly deviceSearch = signal('');

  readonly orderModel = linkedSignal({
    source: this.order,
    computation: (order: Order | null) => ({
      description: order?.description ?? '',
      assignedType: order?.assigneeType ?? '',
      assigneeId: order?.assigneeId ?? '',
      devicesIds: (order?.items.map((d) => d.deviceId) ?? []) as string[],
    }),
  });

  readonly filteredDevices = computed(() => {
    const selected = this.orderModel().devicesIds;
    const search = this.deviceSearch().toLowerCase().trim();
    return this.devices().filter(
      (d) =>
        !selected.includes(d.id) &&
        (!search || d.name?.toLowerCase().includes(search) || d.brand?.toLowerCase().includes(search)),
    );
  });

  readonly deviceNameMap = computed(() => {
    const map: { [id: string]: string } = {};
    for (const device of this.devices()) {
      map[device.id] = device.name;
    }
    return map;
  });

  readonly orderForm = form(this.orderModel, (s) => {
    required(s.description, { message: 'Campo obligatorio.' });
    validate(s.description, ({ value }) => {
      if (!value().trim()) return { kind: 'whitespace', message: 'No debe contener solo espacios en blanco.' };
      return undefined;
    });
    required(s.assignedType, { message: 'Selecciona el tipo de asignación.' });
    required(s.assigneeId, { message: 'Selecciona un responsable.' });
    validate(s.devicesIds, ({ value }) => {
      if (!value().length) return { kind: 'required', message: 'Selecciona al menos un dispositivo.' };
      return undefined;
    });
  });

  ngOnInit(): void {
    this.loadDevices();
    this.loadGroups();
    this.loadEmployees();
  }

  private loadDevices(): void {
    this.devicesService
      .getAllDevices()
      .pipe(
        switchMap((devices) => {
          if (!devices || devices.length === 0) return of([]);
          const rq: DevicesBatchRq = { ids: devices.map((d) => d.id) };
          return this.devicesService.hasActiveAssignmentBatch(rq).pipe(
            map((assignments) =>
              this.validateDevices(
                devices.map((device): Device => {
                  const found = assignments.find((a) => a.deviceId === device.id);
                  return { ...device, assignmentActive: found ? found.active : false, selected: false };
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (devices) => this.devices.set(devices),
        error: () => this.devices.set([]),
      });
  }

  private loadGroups(): void {
    this.groupsService
      .getAllGroups()
      .pipe(
        map((groups) => this.validateGroups(groups)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: () => this.groups.set([]),
      });
  }

  private loadEmployees(): void {
    this.employeesService
      .getAllEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => this.employees.set(employees),
        error: () => this.employees.set([]),
      });
  }

  addDevice(deviceId: string): void {
    this.orderModel.update((m) => ({ ...m, devicesIds: [...m.devicesIds, deviceId] }));
    this.deviceSearch.set('');
    this.showDeviceDropdown.set(false);
  }

  removeDevice(deviceId: string): void {
    this.orderModel.update((m) => ({ ...m, devicesIds: m.devicesIds.filter((id) => id !== deviceId) }));
  }

  onAssignedTypeChange(): void {
    this.orderModel.update((m) => ({ ...m, assigneeId: '' }));
  }

  onSubmit(): void {
    submit(this.orderForm, async () => {
      const order = this.order();
      if (order?.id && !this.orderForm().dirty()) {
        toast.warning('No se detectaron cambios en la orden');
        return;
      }

      this.formLoading.set(true);
      this.formError.set('');
      const model = this.orderModel();
      const isEdit = !!order;
      const result: CreateOrderRequest = {
        description: model.description.trim(),
        assigneeType: model.assignedType,
        assigneeId: model.assigneeId,
        devicesIds: model.devicesIds,
      };
      const op$ = order
        ? this.ordersService.updateOrder(order.id, result)
        : this.ordersService.createOrder(result);

      try {
        const savedOrder = await firstValueFrom(op$);
        this.save.emit({ order: savedOrder, mode: isEdit ? 'edit' : 'create' });
      } catch (err: unknown) {
        const anyErr = err as { error?: { message?: string }; message?: string };
        const msg = anyErr?.error?.message || anyErr?.message || 'Error al guardar la orden';
        this.formError.set(msg);
        toast.error('Error al guardar la orden', { description: msg });
      } finally {
        this.formLoading.set(false);
      }
    });
  }

  validateDevices(devices: Device[]): Device[] {
    const order = this.order();
    const orderDeviceIds = order?.items.map((i) => String(i.deviceId)) ?? [];
    return devices.filter((d) => {
      if (orderDeviceIds.includes(String(d.id))) return true;
      return d.status === DeviceStatus.GOOD_CONDITION && !d.assignmentActive;
    });
  }

  validateGroups(groups: Group[]): Group[] {
    return groups.filter(
      (g) => Array.isArray(g.employees) && g.employees.some((e) => e.status === EmployeeStatus.ACTIVE),
    );
  }
}
