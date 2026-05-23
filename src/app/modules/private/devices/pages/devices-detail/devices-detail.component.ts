import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DevicesService } from '../../services/devices.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Device, DeviceAssignment } from '../../models/device.model';
import { catchError, concatMap, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { OrdersService } from '../../../orders/services/orders.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-devices-detail',
  templateUrl: './devices-detail.component.html',
  styleUrls: ['./devices-detail.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
})
export class DevicesDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly devicesService = inject(DevicesService);
  private readonly location = inject(Location);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = toSignal(inject(LoadingService).loading$, { initialValue: false });
  readonly device = signal<Device | null>(null);
  readonly deviceAssignments = signal<DeviceAssignment[]>([]);
  readonly error = signal('');

  ngOnInit(): void {
    this.initParams();
  }

  initParams(): void {
    this.device.set(null);
    this.deviceAssignments.set([]);

    this.route.params
      .pipe(
        tap(() => this.error.set('')),
        switchMap((params) => this.getDeviceAndAssignments(params['id'])),
        concatMap(({ device, assignments }) =>
          this.enrichAssignmentsWithOrder(assignments, device),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result) {
          this.device.set(result.device);
          this.deviceAssignments.set(result.assignments);
        }
      });
  }

  private getDeviceAndAssignments(deviceId: string) {
    return forkJoin({
      device: this.devicesService.getDeviceById(deviceId).pipe(
        catchError((err) => {
          toast.error('Error al cargar el dispositivo');
          this.error.set(err?.error?.message || 'Error al cargar dispositivo');
          return of(null);
        }),
      ),
      assignments: this.devicesService
        .getDeviceAssignmentHistory(deviceId)
        .pipe(catchError(() => of([]))),
    });
  }

  private enrichAssignmentsWithOrder(assignments: DeviceAssignment[], device: Device | null) {
    if (!assignments.length) {
      this.device.set(device);
      this.deviceAssignments.set([]);
      return of(null);
    }
    return forkJoin(
      assignments.map((a) => {
        if (!a.orderId) {
          return of({ ...a, orderName: this.getShortId(a.orderId || ''), orderFound: false });
        }
        return this.ordersService.getOrderById(a.orderId).pipe(
          map((order) => ({
            ...a,
            orderName: order?.description || this.getShortId(a.orderId),
            orderFound: !!order,
          })),
          catchError(() =>
            of({ ...a, orderName: this.getShortId(a.orderId), orderFound: false }),
          ),
        );
      }),
    ).pipe(map((assignmentsWithOrderName) => ({ device, assignments: assignmentsWithOrderName })));
  }

  goBack(): void {
    this.location.back();
  }

  getShortId(id: string): string {
    return id.substring(0, 8);
  }

  goDetailOrder(orderId: string): void {
    if (!orderId) return;
    this.router.navigate(['/app/orders/', orderId]);
  }

  refreshData(): void {
    this.initParams();
  }
}
