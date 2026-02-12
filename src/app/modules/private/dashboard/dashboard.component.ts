import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Order, orderStates } from '../orders/models/Orders';
import { DevicesService } from '../devices/services/devices.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../public/auth/models/user.model';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { Observable } from 'rxjs';
import { Device, DeviceStatus } from '../devices/models/device.model';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { OrdersService } from '../orders/services/orders.service';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Componente de Dashboard
 * Muestra estadísticas y datos relevantes para el usuario, como el número total de dispositivos y las órdenes recientes
 *
 * @author Bunnystring
 * @since 2026-02-06
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Datos del usuario autenticado
  user: User | null = null;

  get loading$(): Observable<boolean> {
    return this.loadingService.loading$;
  }

  // Estado de carga
  stats = {
    // Dispositivos
    totalDevices: 0,
    goodCondition: 0,
    occupied: 0,
    needsRepair: 0,
    fair: 0,

    // Ordenes
    totalOrders: 0,
    activeOrders: 0,
    createdOrders: 0,
    inProgressOrders: 0,
    despatchedOrders: 0,
    finishedOrders: 0,

    // Otros
    totalDevicesInOrders: 0,
    averageItemsPerOrder: 0,
  };

  recentDevices: Device[] = [];
  recentOrders: Order[] = [];
  devicesByBrand: { brand: string; count: number }[] = [];

  // Referencia a orderStates para usar en el template
  orderStates = orderStates;

  // Alertas dinámicas
  alerts: Array<{
    type: string;
    icon: string;
    title: string;
    message: string;
    count: number;
  }> = [];

  destroy$: Subject<void> = new Subject<void>();

  constructor(
    private devicesService: DevicesService,
    private authService: AuthService,
    private ordersService: OrdersService,
    private loadingService: LoadingService
  ) {}

  /**
   * Inicializa el componente cargando los datos necesarios para mostrar en el dashboard, como los dispositivos y las órdenes, y calculando las estadísticas correspondientes
   *
   * @return void
   */
  ngOnInit() {
    this.initParams();
    this.loadUser();
  }

  /**
   * Limpia las suscripciones para evitar fugas de memoria cuando el componente es destruido
   *
   * @return void
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los parámetros del dashboard
   */
  initParams() {
    this.loadDashboardData();
  }

  /**
   * Carga los datos necesarios para el dashboard, incluyendo dispositivos y órdenes, y calcula las estadísticas correspondientes
   *
   * @return void
   */
  private loadDashboardData(): void {
    forkJoin({
      devices: this.devicesService.getAllDevices(),
      orders: this.ordersService.getAllOrders(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ devices, orders }) => {
          // console.log('✅ Dispositivos cargados:', devices);
          // console.log('✅ Órdenes cargadas:', orders);

          // Calcular estadísticas de dispositivos
          this.calculateDeviceStats(devices);

          // Dispositivos recientes (últimos 5)
          this.recentDevices = this.getRecentDevices(devices, 5);

          // Dispositivos por marca
          this.devicesByBrand = this.getDevicesByBrand(devices);

          // Calcular estadísticas de órdenes
          this.calculateOrderStats(orders);

          // Órdenes recientes (últimas 5)
          this.recentOrders = this.getRecentOrders(orders, 5);

          // Actualizar alertas
          this.updateAlerts();

        },
        error: (error) => {
          console.error('❌ Error al cargar datos del dashboard:', error);
        },
      });
  }

  /**
   * Obtener dispositivos recientes basados en la fecha de creación
   * @param devices Lista completa de dispositivos
   */
  private getRecentDevices(devices: Device[], limit: number): Device[] {
    return devices
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Obtener conteo de dispositivos por marca
   * @return Array de objetos con marca y conteo, ordenados por conteo descendente
   */
  private getDevicesByBrand(
    devices: Device[],
  ): { brand: string; count: number }[] {
    const brandCount: { [key: string]: number } = {};

    devices.forEach((device) => {
      const brand = device.brand.toUpperCase();
      brandCount[brand] = (brandCount[brand] || 0) + 1;
    });

    return Object.entries(brandCount)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 marcas
  }

  /**
   * Carga datos del usuario autenticado para mostrar en el dashboard
   *
   * @return void
   */
  private loadUser(): void {
    this.user = this.authService.getCurrentUser();
    // console.log('👤 Usuario en Dashboard:', this.user);
  }

  /**
   * Obtener primer nombre del usuario
   * @returns Primer nombre o string vacío
   */
  getFirstName(): string {
    if (!this.user?.name) {
      return '';
    }
    return this.user.name.split(' ')[0];
  }

  /**
   * Obtener saludo personalizado
   * @returns Mensaje de bienvenida
   */
  getGreeting(): string {
    const firstName = this.getFirstName();
    return firstName ? `👋 ¡Bienvenido, ${firstName}!` : '👋 ¡Bienvenido!';
  }

  /**
   * Calcular porcentaje para gráficos de progreso
   * @param value Valor actual
   * @param total Valor total
   * @returns Porcentaje calculado
   */
  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  /**
   * Refrescar datos del dashboard después de una acción que pueda haber cambiado el estado de los dispositivos u órdenes
   * @returns
   * void
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Calcular estadísticas de dispositivos en base a su estado
   * @param devices Lista de dispositivos
   * @return void
   */
  private calculateDeviceStats(devices: Device[]): void {
    this.stats.totalDevices = devices.length;
    this.stats.goodCondition = devices.filter(
      (d) => d.status === DeviceStatus.GOOD_CONDITION,
    ).length;
    this.stats.occupied = devices.filter(
      (d) => d.status === DeviceStatus.OCCUPIED,
    ).length;
    this.stats.needsRepair = devices.filter(
      (d) => d.status === DeviceStatus.NEEDS_REPAIR,
    ).length;
    this.stats.fair = devices.filter(
      (d) => d.status === DeviceStatus.FAIR,
    ).length;
  }

  /**
   * Calcular estadísticas de órdenes
   * @param orders Lista de órdenes
   * @return void
   */
  private calculateOrderStats(orders: Order[]): void {
    this.stats.totalOrders = orders.length;
    this.stats.createdOrders = orders.filter(
      (o) => o.state === 'CREATED',
    ).length;
    this.stats.inProgressOrders = orders.filter(
      (o) => o.state === 'IN_PROGRESS',
    ).length;
    this.stats.despatchedOrders = orders.filter(
      (o) => o.state === 'DISPATCHED',
    ).length;
    this.stats.finishedOrders = orders.filter(
      (o) => o.state === 'FINISHED',
    ).length;
    this.stats.activeOrders =
      this.stats.createdOrders +
      this.stats.inProgressOrders +
      this.stats.despatchedOrders;

    // Calcular total de dispositivos en órdenes
    this.stats.totalDevicesInOrders = orders.reduce(
      (sum, order) => sum + order.items.length,
      0,
    );

    // Calcular promedio de items por orden
    this.stats.averageItemsPerOrder =
      orders.length > 0
        ? Math.round((this.stats.totalDevicesInOrders / orders.length) * 10) /
          10
        : 0;
  }

  /**
   * Obtener órdenes recientes basadas en la fecha de creación
   * @param orders Lista completa de órdenes
   * @param limit Cantidad de órdenes a retornar
   * @return Array de órdenes recientes
   */
  private getRecentOrders(orders: Order[], limit: number): Order[] {
    return orders
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Actualizar mensajes y conteos de alertas basados en las estadísticas actuales
   * @returns void
   */
  private updateAlerts(): void {
    this.alerts = [
      {
        type: 'warning',
        icon: '⚠️',
        title: 'Dispositivos que necesitan reparación',
        message: `${this.stats.needsRepair} dispositivo${this.stats.needsRepair !== 1 ? 's' : ''} requiere${this.stats.needsRepair === 1 ? '' : 'n'} atención`,
        count: this.stats.needsRepair,
      },
      {
        type: 'info',
        icon: '📋',
        title: 'Órdenes creadas',
        message: `${this.stats.createdOrders} orden${this.stats.createdOrders !== 1 ? 'es' : ''} esperando inicio`,
        count: this.stats.createdOrders,
      },
      {
        type: 'primary',
        icon: '🔄',
        title: 'Órdenes en progreso',
        message: `${this.stats.inProgressOrders} orden${this.stats.inProgressOrders !== 1 ? 'es' : ''} en proceso`,
        count: this.stats.inProgressOrders,
      },
      {
        type: 'success',
        icon: '✅',
        title: 'Órdenes finalizadas',
        message: `${this.stats.finishedOrders} orden${this.stats.finishedOrders !== 1 ? 'es' : ''} completadas`,
        count: this.stats.finishedOrders,
      },
    ];
  }

  /**
   * Obtener clase CSS para el estado de la orden
   * @param state Estado de la orden
   * @returns Clase CSS correspondiente
   */
  getOrderStateClass(state: string): string {
    const stateMap: Record<string, string> = {
      CREATED: 'badge-info',
      IN_PROGRESS: 'badge-warning',
      DESPATCHED: 'badge-primary',
      FINISHED: 'badge-success',
    };
    return stateMap[state] || 'badge-ghost';
  }

  /**
   * Obtener texto para estado de orden
   * @param state Estado de la orden
   * @returns Texto legible del estado
   */
  getOrderStateText(state: string): string {
    return orderStates[state as keyof typeof orderStates] || state;
  }

  /**
   * Obtener clase CSS para tipo de alerta
   * @param type Tipo de alerta
   * @returns Clase CSS correspondiente
   */
  getAlertClass(type: string): string {
    const alertMap: Record<string, string> = {
      warning: 'alert-warning',
      info: 'alert-info',
      primary: 'alert-primary',
      success: 'alert-success',
      error: 'alert-error',
    };
    return alertMap[type] || 'alert-info';
  }

  /**
   * Formatear fecha
   * @param date Fecha en formato string
   * @returns Fecha formateada
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formatear fecha relativa (hace X tiempo)
   * @param date Fecha en formato string
   * @returns Texto con tiempo relativo
   */
  getRelativeTime(date: string): string {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
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

  /**
   * Obtener descripción truncada
   * @param description Descripción completa
   * @param maxLength Longitud máxima
   * @returns Descripción truncada
   */
  getTruncatedDescription(description: string, maxLength: number = 50): string {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }

  /**
   * Obtener cantidad de dispositivos en una orden
   * @param order Orden
   * @returns Cantidad de dispositivos
   */
  getDeviceCount(order: Order): number {
    return order.items.length;
  }

  /**
   * Obtener color para el estado del dispositivo original
   * @param state Estado del dispositivo
   * @returns Clase CSS de color
   */
  getDeviceStateColor(state: string): string {
    const colorMap: Record<string, string> = {
      GOOD_CONDITION: 'badge-success',
      FAIR: 'badge-warning',
      NEEDS_REPAIR: 'badge-error',
      OCCUPIED: 'badge-info',
    };
    return colorMap[state] || 'badge-ghost';
  }

  /**
   * Obtener ícono para tipo de asignado
   * @param type Tipo de asignado
   * @returns Emoji correspondiente
   */
  getAssigneeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      GROUP: '👥',
      INDIVIDUAL: '👤',
      TECHNICIAN: '🔧',
      TEAM: '🏢',
    };
    return iconMap[type] || '📋';
  }

  /**
   * Formatear UUID corto (primeros 8 caracteres)
   * @param id UUID completo
   * @returns UUID truncado
   */
  getShortId(id: string): string {
    return id.substring(0, 8);
  }
}
