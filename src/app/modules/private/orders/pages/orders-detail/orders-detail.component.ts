import { DevicesBatchRq } from './../../../devices/models/device.model';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, Location, NgClass, TitleCasePipe } from '@angular/common';
import { OrdersService } from '../../services/orders.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { tap, catchError, switchMap, of, concatMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Order, OrderStates, OrderStatusColors } from '../../models/orders.model';
import { DevicesService } from '../../../devices/services/devices.service';
import {
  DeviceStatus,
  DeviceStatusLabels,
  DeviceStatusColors,
} from '../../../devices/models/device.model';
import { GroupsService } from '../../../groups/services/groups.service';
import { EmployeesService } from '../../../employees/services/employees.service';

@Component({
  selector: 'app-orders-detail',
  templateUrl: './orders-detail.component.html',
  styleUrls: ['./orders-detail.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TitleCasePipe, DatePipe],
})
export class OrdersDetailComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly devicesService = inject(DevicesService);
  private readonly employeeService = inject(EmployeesService);
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = toSignal(inject(LoadingService).loading$, { initialValue: false });
  readonly order = signal<Order | null>(null);
  readonly error = signal('');
  readonly groupName = signal('');

  readonly DeviceStatusLabels = DeviceStatusLabels;
  readonly DeviceStatusColors = DeviceStatusColors;

  get groupNameTooltip(): string {
    return this.groupName() ? 'Grupo: ' + this.groupName() : '';
  }

  get employeeNameTooltip(): string {
    return this.order()?.assigneeId ? 'Empleado: ' + this.order()?.assigneeId : '';
  }

  ngOnInit(): void {
    this.getOrderDetail();
  }

  getOrderDetail(): void {
    this.route.params
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.error.set('')),
        switchMap((params) =>
          this.ordersService.getOrderById(params['id']).pipe(
            tap((order) => this.order.set(order)),
            catchError((err) => {
              const msg = err?.error?.message || 'Error al cargar orden';
              this.error.set(msg);
              toast.error('Error al cargar la orden', { description: msg });
              this.order.set(null);
              return of(null);
            }),
          ),
        ),
        concatMap((order) => {
          if (order && Array.isArray(order.items) && order.items.length > 0) {
            const rq: DevicesBatchRq = { ids: order.items.map((item) => item.deviceId) };
            return this.devicesService.getDevicesBatch(rq).pipe(
              tap((devices) => {
                if (devices && Array.isArray(devices)) {
                  order.items.forEach((item) => {
                    item.device = devices.find((device) => device.id === item.deviceId)!;
                  });
                  this.order.set({ ...order });
                }
              }),
              catchError(() => of(null)),
            );
          }
          return of(null);
        }),
        concatMap(() => {
          const order = this.order();
          if (!order) return of(null);
          if (order.assigneeType !== 'GROUP') {
            return this.employeeService.getEmployeeById(order.assigneeId).pipe(
              tap((employee) => {
                this.order.update((o) => (o ? { ...o, assigneeId: employee.fullName } : null));
              }),
              catchError(() => of(null)),
            );
          }
          return this.groupsService.getGroupById(order.assigneeId).pipe(
            tap((group) => {
              const label = group.employees?.length
                ? `(${group.employees.length} empleados)`
                : group.name;
              this.order.update((o) => (o ? { ...o, assigneeId: label } : null));
              this.groupName.set(group.name);
            }),
            catchError(() => of(null)),
          );
        }),
      )
      .subscribe();
  }

  goBack(): void {
    this.location.back();
  }

  getShortId(id: string): string {
    return id.substring(0, 8);
  }

  refreshData(): void {
    this.getOrderDetail();
  }

  getDeviceStatusLabel(status: string | undefined | null): string {
    return status && DeviceStatusLabels[status as DeviceStatus]
      ? DeviceStatusLabels[status as DeviceStatus]
      : '-';
  }

  getDeviceStatusColor(status: string | undefined | null): string {
    return (
      'badge-' +
      (status && DeviceStatusColors[status as DeviceStatus]
        ? DeviceStatusColors[status as DeviceStatus]
        : 'secondary')
    );
  }

  getOrderStateBadge(state?: OrderStates | null): string {
    return (
      'badge badge-' +
      (state && OrderStatusColors[state] ? OrderStatusColors[state] : 'neutral') +
      ' text-xl p-4'
    );
  }

  getOrderStateLabel(state?: OrderStates | null): string {
    return (state ? OrderStates[state] : '-') ?? '-';
  }

  goAsignedDetail(): void {
    const order = this.order();
    switch (order?.assigneeType) {
      case 'EMPLOYEE':
        this.router.navigate(['/app/employees/', order.assigneeId]);
        break;
      case 'GROUP':
        this.router.navigate(['/app/groups/', order.assigneeId]);
        break;
    }
  }
}
