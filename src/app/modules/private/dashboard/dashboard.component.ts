import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStates } from '../orders/models/Orders';
import { DevicesService } from '../devices/services/devices.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../public/auth/models/user.model';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { catchError, Observable, of, map } from 'rxjs';
import { Device, DeviceStatus } from '../devices/models/device.model';
import { Subject } from 'rxjs/internal/Subject';
import { OrdersService } from '../orders/services/orders.service';
import { LoadingService } from '../../../core/services/loading.service';
import { Alerta, DashboardStatsType } from './models/DashboardStats';

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

  // Observables para estadísticas y datos del dashboard
  dashboardStats$: Observable<{
    totalDevices: number;
    goodCondition: number;
    occupied: number;
    needsRepair: number;
    fair: number;
    totalOrders: number;
    activeOrders: number;
    createdOrders: number;
    inProcessOrders: number;
    despatchedOrders: number;
    finishedOrders: number;
    totalDevicesInOrders: number;
    averageItemsPerOrder: number;
  }> = of({
    totalDevices: 0,
    goodCondition: 0,
    occupied: 0,
    needsRepair: 0,
    fair: 0,
    totalOrders: 0,
    activeOrders: 0,
    createdOrders: 0,
    inProcessOrders: 0,
    despatchedOrders: 0,
    finishedOrders: 0,
    totalDevicesInOrders: 0,
    averageItemsPerOrder: 0,
  });

  // Datos para mostrar en el dashboard
  recentDevices: Device[] = [];
  recentOrders: Order[] = [];
  devicesByBrand: { brand: string; count: number }[] = [];

  // Referencia a orderStates para usar en el template
  orderStates = OrderStates;

  // Manejo de errores
  deviceError = false;
  deviceErrorMessage = '';
  orderError = false;
  orderErrorMessage = '';
  isRetrying = false;


  // Computed property para saber si hay algún error
  get hasAnyError(): boolean {
    return this.deviceError || this.orderError;
  }

  // Subject para manejar desuscripciones y evitar fugas de memoria
  destroy$: Subject<void> = new Subject<void>();

  constructor(
    private devicesService: DevicesService,
    private authService: AuthService,
    private ordersService: OrdersService,
    private loadingService: LoadingService,
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
   * Carga los datos del dashboard, incluyendo dispositivos y órdenes,
   * y maneja los errores de forma individual para cada recurso, permitiendo mostrar
   * datos previos si una de las cargas falla, y actualizando las estadísticas y alertas en consecuencia
   * @returns void
   */
  private loadDashboardData(): void {
    this.deviceError = false;
    this.deviceErrorMessage = '';
    this.orderError = false;
    this.orderErrorMessage = '';
    this.dashboardStats$ = forkJoin({
      devices: this.devicesService.getAllDevices().pipe(
        catchError((error) => {
          console.error('Error al cargar dispositivos:', error);
          this.deviceError = true;
          this.deviceErrorMessage =
            error.message || 'Error al cargar dispositivos';
          return of([] as Device[]);
        }),
      ),
      orders: this.ordersService.getAllOrders().pipe(
        catchError((error) => {
          console.error('Error al cargar órdenes:', error);
          this.orderError = true;
          this.orderErrorMessage = error.message || 'Error al cargar órdenes';
          return of([] as Order[]);
        }),
      ),
    }).pipe(
      map(({ devices, orders }) => {
        this.recentOrders = this.getRecentOrders(orders, 5);
        this.devicesByBrand = this.getDevicesByBrand(devices);
        const totalDevices = devices.length;
        const goodCondition = devices.filter(
          (d) => d.status === DeviceStatus.GOOD_CONDITION,
        ).length;
        const occupied = devices.filter(
          (d) => d.status === DeviceStatus.OCCUPIED,
        ).length;
        const needsRepair = devices.filter(
          (d) => d.status === DeviceStatus.NEEDS_REPAIR,
        ).length;
        const fair = devices.filter(
          (d) => d.status === DeviceStatus.FAIR,
        ).length;

        const totalOrders = orders.length;
        const createdOrders = orders.filter(
          (o) => o.state === 'CREATED',
        ).length;
        const inProcessOrders = orders.filter(
          (o) => o.state === 'IN_PROCESS',
        ).length;
        const despatchedOrders = orders.filter(
          (o) => o.state === 'DISPATCHED',
        ).length;
        const finishedOrders = orders.filter(
          (o) => o.state === 'FINISHED',
        ).length;
        const activeOrders =
          createdOrders + inProcessOrders + despatchedOrders;

        const totalDevicesInOrders = orders.reduce(
          (sum, order) => sum + (order.items?.length || 0),
          0,
        );
        const averageItemsPerOrder =
          orders.length > 0
            ? Math.round((totalDevicesInOrders / orders.length) * 10) / 10
            : 0;

        return {
          totalDevices,
          goodCondition,
          occupied,
          needsRepair,
          fair,
          totalOrders,
          activeOrders,
          createdOrders,
          inProcessOrders,
          despatchedOrders,
          finishedOrders,
          totalDevicesInOrders,
          averageItemsPerOrder,
        };
      }),
    );
  }

  /**
   * Extrae un mensaje de error legible para el usuario basado en el error recibido
   * y el recurso que se intentaba cargar, manejando casos comunes como falta de conexión,
   * recursos no encontrados o errores del servidor
   * @param error
   * @param resource
   * @returns
   */
  private extractErrorMessage(error: any, resource: string): string {
    if (error.message) {
      return error.message;
    }

    if (error.status === 0) {
      return `No se pudo conectar al servidor de ${resource}`;
    }

    if (error.status === 404) {
      return `Servicio de ${resource} no encontrado`;
    }

    if (error.status >= 500) {
      return `Error del servidor de ${resource}`;
    }

    return `Error al cargar ${resource}`;
  }

  /**
   * Reintentar cargar los datos del dashboard,
   * reseteando los estados de error y mostrando el indicador de carga mientras se realiza la nueva solicitud,
   * permitiendo al usuario intentar recuperar los datos después de un error sin necesidad de recargar toda la página
   * @returns void
   */
  retryLoadData(): void {
    this.isRetrying = true;
    this.loadDashboardData();
  }

  /**
   * Reintentar solo dispositivos en caso de error,
   * permitiendo al usuario intentar recuperar los datos de dispositivos sin afectar la sección de órdenes,
   * y viceversa
   * @returns void
   */
  retryDevices(): void {
    this.isRetrying = true;
    this.deviceError = false;
    this.deviceErrorMessage = '';

    this.devicesService
      .getAllDevices()
      .pipe(
        catchError((error) => {
          console.error(' Error al cargar dispositivos:', error);
          this.deviceError = true;
          this.deviceErrorMessage = this.extractErrorMessage(
            error,
            'dispositivos',
          );
          this.isRetrying = false;
          return of([] as Device[]);
        }),
      )
      .subscribe((devices) => {
        if (devices.length > 0) {
          this.recentDevices = this.getRecentDevices(devices, 5);
          this.devicesByBrand = this.getDevicesByBrand(devices);
        } else {
          // Si no hay datos y no hay error, resetear
          if (!this.deviceError) {
            this.recentDevices = [];
            this.devicesByBrand = [];
          }
        }
        this.isRetrying = false;
      });
  }

  /**
   * Reintentar solo órdenes en caso de error,
   * permitiendo al usuario intentar recuperar los datos de órdenes sin afectar la sección de dispositivos,
   * y viceversa
   * @returns void
   */
  retryOrders(): void {
    this.isRetrying = true;
    this.orderError = false;
    this.orderErrorMessage = '';

    this.ordersService
      .getAllOrders()
      .pipe(
        catchError((error) => {
          console.error(' Error al cargar órdenes:', error);
          this.orderError = true;
          this.orderErrorMessage = this.extractErrorMessage(error, 'órdenes');
          this.isRetrying = false;
          return of([] as Order[]);
        }),
      )
      .subscribe((orders) => {
        if (orders.length > 0) {
          this.recentOrders = this.getRecentOrders(orders, 5);
        } else {
          if (!this.orderError) {
            this.recentOrders = [];
          }
        }
        this.isRetrying = false;
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
  getAlerts(stats: DashboardStatsType): Alerta[] {
    return [
      {
        type: 'warning',
        icon: '⚠️',
        title: 'Dispositivos que necesitan reparación',
        message: `${stats.needsRepair} dispositivo${stats.needsRepair !== 1 ? 's' : ''} requiere${stats.needsRepair === 1 ? '' : 'n'} atención`,
        count: stats.needsRepair,
      },
      {
        type: 'info',
        icon: '📋',
        title: 'Órdenes creadas',
        message: `${stats.createdOrders} orden${stats.createdOrders !== 1 ? 'es' : ''} esperando inicio`,
        count: stats.createdOrders,
      },
      {
        type: 'primary',
        icon: '🔄',
        title: 'Órdenes en progreso',
        message: `${stats.inProcessOrders} orden${stats.inProcessOrders !== 1 ? 'es' : ''} en proceso`,
        count: stats.inProcessOrders,
      },
      {
        type: 'success',
        icon: '✅',
        title: 'Órdenes finalizadas',
        message: `${stats.finishedOrders} orden${stats.finishedOrders !== 1 ? 'es' : ''} completadas`,
        count: stats.finishedOrders,
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
      IN_PROCESS: 'badge-warning',
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
    return OrderStates[state as keyof typeof OrderStates] || state;
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
      INDIVIDUAL: '👤'
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
