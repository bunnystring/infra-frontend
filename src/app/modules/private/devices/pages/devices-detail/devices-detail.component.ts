import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevicesService } from '../../services/devices.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Device, DeviceAssignment } from '../../models/device.model';
import {
  Observable,
  catchError,
  concatMap,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CommonModule, Location } from '@angular/common';
import { OrdersService } from '../../../orders/services/orders.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-devices-detail',
  templateUrl: './devices-detail.component.html',
  styleUrls: ['./devices-detail.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DevicesDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly devicesService = inject(DevicesService);
  private readonly location = inject(Location);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading$ = inject(LoadingService).loading$;

  device$: Observable<Device | null> = of();
  deviceAssignments$: Observable<DeviceAssignment[]> = of([]);

  loading = false;
  error = '';

  ngOnInit() {
    this.initParams();
  }

  initParams(): void {
    this.device$ = of();
    this.deviceAssignments$ = of([]);

    this.route.params
      .pipe(
        tap(() => {
          this.loading = true;
          this.error = '';
        }),
        switchMap((params) => this.getDeviceAndAssignments(params['id'])),
        concatMap(({ device, assignments }) =>
          this.enrichAssignmentsWithOrder(assignments, device),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result) {
          this.device$ = of(result.device);
          this.deviceAssignments$ = of(result.assignments);
        }
      });
  }

  private getDeviceAndAssignments(deviceId: string) {
    return forkJoin({
      device: this.devicesService.getDeviceById(deviceId).pipe(
        catchError((err) => {
          toast.error('Error al cargar el dispositivo');
          this.error = err?.error?.message || 'Error al cargar dispositivo';
          return of(null);
        }),
      ),
      assignments: this.devicesService
        .getDeviceAssignmentHistory(deviceId)
        .pipe(catchError(() => of([]))),
    }).pipe(finalize(() => (this.loading = false)));
  }

  private enrichAssignmentsWithOrder(
    assignments: DeviceAssignment[],
    device: Device | null,
  ) {
    if (!assignments.length) {
      this.device$ = of(device);
      this.deviceAssignments$ = of([]);
      return of(null);
    }
    return forkJoin(
      assignments.map((a) => {
        if (!a.orderId) {
          return of({
            ...a,
            orderName: this.getShortId(a.orderId || ''),
            orderFound: false,
          });
        }
        return this.ordersService.getOrderById(a.orderId).pipe(
          map((order) => ({
            ...a,
            orderName: order?.description || this.getShortId(a.orderId),
            orderFound: !!order,
          })),
          catchError(() =>
            of({
              ...a,
              orderName: this.getShortId(a.orderId),
              orderFound: false,
            }),
          ),
        );
      }),
    ).pipe(
      map((assignmentsWithOrderName) => ({
        device,
        assignments: assignmentsWithOrderName,
      })),
    );
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
