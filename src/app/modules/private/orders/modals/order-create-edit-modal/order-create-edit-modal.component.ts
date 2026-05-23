import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { switchMap, of, map, finalize } from 'rxjs';
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
import { noWhitespaceValidator } from '../../../../../core/utils/form-validators.utils';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-order-create-edit-modal',
  templateUrl: './order-create-edit-modal.component.html',
  styleUrls: ['./order-create-edit-modal.component.css'],
  imports: [ReactiveFormsModule, FormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCreateEditModalComponent implements OnInit {
  private readonly devicesService = inject(DevicesService);
  private readonly groupsService = inject(GroupsService);
  private readonly employeesService = inject(EmployeesService);
  private readonly fb = inject(FormBuilder);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = input<Order | null>(null);
  readonly close = output<void>();
  readonly save = output<OrderFormResult>();

  orderForm!: FormGroup;
  readonly submitted = signal(false);
  readonly formLoading = signal(false);
  readonly formError = signal('');

  readonly OrderStates = OrderStates;
  readonly OrderStatesLabels = OrderStateLabels;

  devices: Device[] = [];
  employees: Employee[] = [];
  groups: Group[] = [];
  readonly assignedType = [
    { label: 'Empleado', value: 'EMPLOYEE' },
    { label: 'Grupo', value: 'GROUP' },
  ];

  showDeviceDropdown = false;
  deviceSearch = '';
  filteredDevices: Device[] = [];
  deviceNameMap: { [id: string]: string } = {};

  constructor() {
    effect(() => {
      this.order();
      untracked(() => {
        if (this.orderForm) {
          this.initForm();
          this.loadDevices();
          this.loadGroups();
          this.loadEmployees();
        }
      });
    });
  }

  ngOnInit(): void {
    this.initForm();
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
        next: (devices) => {
          this.devices = devices;
          this.filterDevices();
          this.updateDeviceNameMap();
          this.cd.detectChanges();
        },
        error: () => {
          this.devices = [];
          this.cd.detectChanges();
        },
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
        next: (groups) => { this.groups = groups; this.cd.detectChanges(); },
        error: () => { this.groups = []; this.cd.detectChanges(); },
      });
  }

  private loadEmployees(): void {
    this.employeesService
      .getAllEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => { this.employees = employees; this.cd.detectChanges(); },
        error: () => { this.employees = []; this.cd.detectChanges(); },
      });
  }

  filterDevices(): void {
    const selected = this.orderForm?.get('devicesIds')?.value || [];
    const search = (this.deviceSearch || '').toLowerCase().trim();
    this.filteredDevices = this.devices.filter(
      (d) =>
        !selected.includes(d.id) &&
        (!search || d.name?.toLowerCase().includes(search) || d.brand?.toLowerCase().includes(search)),
    );
  }

  addDevice(deviceId: string): void {
    const selected = this.orderForm.get('devicesIds')?.value || [];
    this.orderForm.get('devicesIds')?.setValue([...selected, deviceId]);
    this.deviceSearch = '';
    this.filterDevices();
  }

  removeDevice(deviceId: string): void {
    const selected = this.orderForm.controls['devicesIds'].value || [];
    this.orderForm.controls['devicesIds'].setValue(selected.filter((id: string) => id !== deviceId));
    this.filterDevices();
  }

  private initForm(): void {
    const order = this.order();
    this.orderForm = this.fb.group({
      description: [order?.description ?? '', [Validators.required, noWhitespaceValidator()]],
      assignedType: [order?.assigneeType ?? '', [Validators.required]],
      assigneeId: [order?.assigneeId ?? '', [Validators.required]],
      devicesIds: [order?.items.map((d) => d.deviceId) ?? [], [Validators.required]],
    });
    this.filterDevices();
    this.orderForm.get('assignedType')?.valueChanges.subscribe(() => {
      this.orderForm.patchValue({ assigneeId: '' });
    });
    this.orderForm.get('devicesIds')?.valueChanges.subscribe(() => {
      this.filterDevices();
    });
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.formError.set('');

    const order = this.order();
    if (order?.id && !this.hasChanges()) {
      toast.warning('No se detectaron cambios en la orden');
      this.cd.markForCheck();
      return;
    }
    if (this.orderForm.invalid) return;

    this.formLoading.set(true);
    this.cd.markForCheck();
    const formValue = this.orderForm.value;
    const isEdit = !!order;
    const result: CreateOrderRequest = {
      description: formValue.description.trim(),
      assigneeType: formValue.assignedType,
      assigneeId: formValue.assigneeId,
      devicesIds: formValue.devicesIds,
    };
    const op$ = order
      ? this.ordersService.updateOrder(order.id, result)
      : this.ordersService.createOrder(result);

    op$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.formLoading.set(false);
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (savedOrder: Order) => {
          this.save.emit({ order: savedOrder, mode: isEdit ? 'edit' : 'create' });
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al guardar la orden';
          this.formError.set(msg);
          toast.error('Error al guardar la orden', { description: msg });
        },
      });
  }

  onAssignedTypeChange(): void {
    this.orderForm.patchValue({ assigneeId: '' });
  }

  onSeleccionarDispositivo(deviceId: string): void {
    const selected = this.orderForm.get('devicesIds')?.value || [];
    this.orderForm.get('devicesIds')?.setValue([...selected, deviceId]);
    this.deviceSearch = '';
    this.filterDevices();
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

  private hasChanges(): boolean {
    const order = this.order();
    if (!order) return true;
    const current = this.orderForm.value;
    const originalIds = order.items.map((d) => d.deviceId).sort();
    const currentIds = [...(current.devicesIds ?? [])].sort();
    return (
      current.description?.trim() !== order.description ||
      current.assignedType !== order.assigneeType ||
      current.assigneeId !== order.assigneeId ||
      originalIds.length !== currentIds.length ||
      !originalIds.every((id, i) => id === currentIds[i])
    );
  }

  private updateDeviceNameMap(): void {
    this.deviceNameMap = {};
    for (const device of this.devices) {
      this.deviceNameMap[device.id] = device.name;
    }
  }
}
