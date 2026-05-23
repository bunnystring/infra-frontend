import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Order, OrderStateLabels } from '../orders/models/Orders';
import { DevicesService } from '../devices/services/devices.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../public/auth/models/user.model';
import { forkJoin, catchError, of, finalize } from 'rxjs';
import { Device, DeviceStatus } from '../devices/models/device.model';
import { OrdersStore } from '../orders/store/orders.store';
import { LoadingService } from '../../../core/services/loading.service';
import { Alerta, DashboardStatsType, DEFAULT_STATS } from './models/DashboardStats';


/**
 * Componente principal del dashboard que muestra estadísticas clave, alertas, y resúmenes de dispositivos y órdenes recientes. Gestiona la carga de datos, manejo de errores y proporciona funcionalidades para refrescar la información.
 * @since 1.0.0
 * @author Bunnystring
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly ordersStore = inject(OrdersStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly devicesService = inject(DevicesService);
  private readonly authService = inject(AuthService);

  readonly isLoading = toSignal(inject(LoadingService).loading$, { initialValue: false });

  readonly user = signal<User | null>(null);

  private readonly _stats = signal<DashboardStatsType>(DEFAULT_STATS);
  readonly dashboardStats = this._stats.asReadonly();

  readonly recentDevices = signal<Device[]>([]);
  readonly recentOrders = signal<Order[]>([]);
  readonly devicesByBrand = signal<{ brand: string; count: number }[]>([]);

  readonly deviceError = signal(false);
  readonly deviceErrorMessage = signal('');
  readonly orderError = signal(false);
  readonly orderErrorMessage = signal('');
  readonly isRetrying = signal(false);

  readonly hasAnyError = computed(() => this.deviceError() || this.orderError());
  readonly alerts = computed(() => this.buildAlerts(this._stats()));

  ngOnInit(): void {
    this.user.set(this.authService.getCurrentUser());
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.deviceError.set(false);
    this.deviceErrorMessage.set('');
    this.orderError.set(false);
    this.orderErrorMessage.set('');

    forkJoin({
      devices: this.devicesService.getAllDevices().pipe(
        catchError((error) => {
          console.error('Error al cargar dispositivos:', error);
          this.deviceError.set(true);
          this.deviceErrorMessage.set(error.message || 'Error al cargar dispositivos');
          return of([] as Device[]);
        }),
      ),
      orders: this.ordersStore.loadOrders().pipe(
        catchError((error) => {
          console.error('Error al cargar órdenes:', error);
          this.orderError.set(true);
          this.orderErrorMessage.set(error.message || 'Error al cargar órdenes');
          return of([] as Order[]);
        }),
      ),
    }).pipe(
      finalize(() => this.isRetrying.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ devices, orders }) => {
      this.recentDevices.set(this.getRecentDevices(devices, 5));
      this.recentOrders.set(this.getRecentOrders(orders, 5));
      this.devicesByBrand.set(this.getDevicesByBrand(devices));
      this._stats.set(this.computeStats(devices, orders));
    });
  }

  retryLoadData(): void {
    this.isRetrying.set(true);
    this.loadDashboardData();
  }

  retryDevices(): void {
    this.isRetrying.set(true);
    this.deviceError.set(false);
    this.deviceErrorMessage.set('');

    this.devicesService
      .getAllDevices()
      .pipe(
        catchError((error) => {
          console.error('Error al cargar dispositivos:', error);
          this.deviceError.set(true);
          this.deviceErrorMessage.set(this.extractErrorMessage(error, 'dispositivos'));
          this.isRetrying.set(false);
          return of([] as Device[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((devices) => {
        if (devices.length > 0) {
          this.recentDevices.set(this.getRecentDevices(devices, 5));
          this.devicesByBrand.set(this.getDevicesByBrand(devices));
        } else if (!this.deviceError()) {
          this.recentDevices.set([]);
          this.devicesByBrand.set([]);
        }
        this.isRetrying.set(false);
      });
  }

  retryOrders(): void {
    this.isRetrying.set(true);
    this.orderError.set(false);
    this.orderErrorMessage.set('');

    this.ordersStore
      .loadOrders()
      .pipe(
        catchError((error) => {
          console.error('Error al cargar órdenes:', error);
          this.orderError.set(true);
          this.orderErrorMessage.set(this.extractErrorMessage(error, 'órdenes'));
          this.isRetrying.set(false);
          return of([] as Order[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((orders) => {
        if (orders.length > 0) {
          this.recentOrders.set(this.getRecentOrders(orders, 5));
        } else if (!this.orderError()) {
          this.recentOrders.set([]);
        }
        this.isRetrying.set(false);
      });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  getFirstName(): string {
    const name = this.user()?.name;
    return name ? name.split(' ')[0] : '';
  }

  getGreeting(): string {
    const firstName = this.getFirstName();
    return firstName ? `👋 ¡Bienvenido, ${firstName}!` : '👋 ¡Bienvenido!';
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  getAlertClass(type: string): string {
    const alertMap: Record<string, string> = {
      warning: 'alert-warning', info: 'alert-info',
      primary: 'alert-primary', success: 'alert-success', error: 'alert-error',
    };
    return alertMap[type] || 'alert-info';
  }

  getOrderStateClass(state: string): string {
    const stateMap: Record<string, string> = {
      CREATED: 'badge-info', IN_PROCESS: 'badge-warning',
      DESPATCHED: 'badge-primary', FINISHED: 'badge-success',
      CREATED_WITH_ERRORS: 'badge-error',
    };
    return stateMap[state] || 'badge-ghost';
  }

  getOrderStateText(state: string): string {
    return OrderStateLabels[state as keyof typeof OrderStateLabels] || state;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  getRelativeTime(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return this.formatDate(date);
  }

  getTruncatedDescription(description: string, maxLength = 50): string {
    return description.length <= maxLength ? description : description.substring(0, maxLength) + '...';
  }

  getDeviceCount(order: Order): number {
    return order.items.length;
  }

  getAssigneeIcon(type: string): string {
    const iconMap: Record<string, string> = { GROUP: '👥', INDIVIDUAL: '👤' };
    return iconMap[type] || '📋';
  }

  getShortId(id: string): string {
    return id.substring(0, 8);
  }

  private computeStats(devices: Device[], orders: Order[]): DashboardStatsType {
    const totalDevices = devices.length;
    const goodCondition = devices.filter(d => d.status === DeviceStatus.GOOD_CONDITION).length;
    const occupied = devices.filter(d => d.status === DeviceStatus.OCCUPIED).length;
    const needsRepair = devices.filter(d => d.status === DeviceStatus.NEEDS_REPAIR).length;
    const fair = devices.filter(d => d.status === DeviceStatus.FAIR).length;

    const totalOrders = orders.length;
    const createdOrders = orders.filter(o => o.state === 'CREATED').length;
    const inProcessOrders = orders.filter(o => o.state === 'IN_PROCESS').length;
    const despatchedOrders = orders.filter(o => o.state === 'DISPATCHED').length;
    const finishedOrders = orders.filter(o => o.state === 'FINISHED').length;
    const activeOrders = createdOrders + inProcessOrders + despatchedOrders;

    const totalDevicesInOrders = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    const averageItemsPerOrder = totalOrders > 0
      ? Math.round((totalDevicesInOrders / totalOrders) * 10) / 10
      : 0;

    return {
      totalDevices, goodCondition, occupied, needsRepair, fair,
      totalOrders, activeOrders, createdOrders, inProcessOrders,
      despatchedOrders, finishedOrders, totalDevicesInOrders, averageItemsPerOrder,
    };
  }

  private buildAlerts(stats: DashboardStatsType): Alerta[] {
    return [
      {
        type: 'warning', icon: '⚠️',
        title: 'Dispositivos que necesitan reparación',
        message: `${stats.needsRepair} dispositivo${stats.needsRepair !== 1 ? 's' : ''} requiere${stats.needsRepair === 1 ? '' : 'n'} atención`,
        count: stats.needsRepair,
      },
      {
        type: 'info', icon: '📋',
        title: 'Órdenes creadas',
        message: `${stats.createdOrders} orden${stats.createdOrders !== 1 ? 'es' : ''} esperando inicio`,
        count: stats.createdOrders,
      },
      {
        type: 'primary', icon: '🔄',
        title: 'Órdenes en progreso',
        message: `${stats.inProcessOrders} orden${stats.inProcessOrders !== 1 ? 'es' : ''} en proceso`,
        count: stats.inProcessOrders,
      },
      {
        type: 'success', icon: '✅',
        title: 'Órdenes finalizadas',
        message: `${stats.finishedOrders} orden${stats.finishedOrders !== 1 ? 'es' : ''} completadas`,
        count: stats.finishedOrders,
      },
    ];
  }

  private extractErrorMessage(error: any, resource: string): string {
    if (error.message) return error.message;
    if (error.status === 0) return `No se pudo conectar al servidor de ${resource}`;
    if (error.status === 404) return `Servicio de ${resource} no encontrado`;
    if (error.status >= 500) return `Error del servidor de ${resource}`;
    return `Error al cargar ${resource}`;
  }

  private getRecentDevices(devices: Device[], limit: number): Device[] {
    return [...devices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  private getDevicesByBrand(devices: Device[]): { brand: string; count: number }[] {
    const brandCount: Record<string, number> = {};
    devices.forEach(device => {
      const brand = device.brand.toUpperCase();
      brandCount[brand] = (brandCount[brand] || 0) + 1;
    });
    return Object.entries(brandCount)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getRecentOrders(orders: Order[], limit: number): Order[] {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}
