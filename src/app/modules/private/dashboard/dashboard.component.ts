import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardStatsDevices } from './models/DashboardStats';
import { RecentOrders } from './models/RecentOrders';
import { DevicesService } from '../devices/services/devices.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../public/auth/models/user.model';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { Device, DeviceStatus } from '../devices/models/device.model';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';

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
  loading = true;

  // Estado de carga
  stats = {
    totalDevices: 0,
    goodCondition: 0,
    occupied: 0,
    needsRepair: 0,
    fair: 0,
    // Temporal hasta tener orders
    activeOrders: 45,
    completedThisMonth: 38,
    totalEmployees: 28,
    monthlyRevenue: 125000000,
    devicesTrend: 12,
    ordersTrend: 8,
  };

  recentDevices: Device[] = [];
  devicesByBrand: { brand: string; count: number }[] = [];

  // Alerts temporales (hasta que tengas endpoint)
  alerts = [
    {
      type: 'warning',
      icon: '⚠️',
      title: 'Dispositivos que necesitan reparación',
      message: '',
      count: 0,
    },
    {
      type: 'info',
      icon: '📱',
      title: 'Dispositivos ocupados',
      message: '',
      count: 0,
    },
  ];

  // Recent activity mock data
  recentOrders = [
    {
      id: 1,
      device: 'iPhone 14 Pro',
      client: 'Juan Pérez',
      status: 'completed',
      date: '2026-02-09',
      amount: 1200,
    },
    {
      id: 2,
      device: 'Samsung Galaxy S23',
      client: 'María García',
      status: 'in-progress',
      date: '2026-02-08',
      amount: 950,
    },
    {
      id: 3,
      device: 'MacBook Air M2',
      client: 'Carlos López',
      status: 'pending',
      date: '2026-02-07',
      amount: 2500,
    },
    {
      id: 4,
      device: 'iPad Pro 12.9"',
      client: 'Ana Martínez',
      status: 'completed',
      date: '2026-02-06',
      amount: 1800,
    },
    {
      id: 5,
      device: 'Dell XPS 15',
      client: 'Pedro Sánchez',
      status: 'in-progress',
      date: '2026-02-05',
      amount: 2200,
    },
  ];

  destroy$: Subject<void> = new Subject<void>();

  constructor(
    private devicesService: DevicesService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.initParams();
    console.log('📊 DashboardComponent inicializado');
    this.loadUser();
  }

  ngOnDestroy() {
    console.log('🧹 DashboardComponent destruido, limpiando recursos');
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
   * Obtiene todos los dispositivos y actualiza las estadísticas del dashboard
   *
   * @return void
   */
  private loadDashboardData(): void {
    this.loading = true;

    this.devicesService.getAllDevices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (devices) => {
          console.log('✅ Dispositivos cargados:', devices);

          // Calcular estadísticas
          this.calculateStats(devices);

          // Dispositivos recientes (últimos 5)
          this.recentDevices = this.getRecentDevices(devices, 5);

          // Dispositivos por marca
          this.devicesByBrand = this.getDevicesByBrand(devices);

          // Actualizar alertas
          this.updateAlerts();

          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar dispositivos:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Calcular estadísticas de dispositivos en base a su estado
   *
   * @return void
   */
  private calculateStats(devices: Device[]): void {
    this.stats.totalDevices = devices.length;
    this.stats.goodCondition = devices.filter(d => d.status === DeviceStatus.GOOD_CONDITION).length;
    this.stats.occupied = devices.filter(d => d.status === DeviceStatus.OCCUPIED).length;
    this.stats.needsRepair = devices.filter(d => d.status === DeviceStatus.NEEDS_REPAIR).length;
    this.stats.fair = devices.filter(d => d.status === DeviceStatus.FAIR).length;
  }

  /**
   * Obtener dispositivos recientes basados en la fecha de creación
   * @param devices Lista completa de dispositivos
   */
  private getRecentDevices(devices: Device[], limit: number): Device[] {
    return devices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Obtener conteo de dispositivos por marca
   * @return Array de objetos con marca y conteo, ordenados por conteo descendente
   */
  private getDevicesByBrand(devices: Device[]): { brand: string; count: number }[] {
    const brandCount: { [key: string]: number } = {};

    devices.forEach(device => {
      const brand = device.brand.toUpperCase();
      brandCount[brand] = (brandCount[brand] || 0) + 1;
    });

    return Object.entries(brandCount)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 marcas
  }

  /**
   * Actualizar mensajes y conteos de alertas basados en las estadísticas actuales
   *
   * @returns void
   */
  private updateAlerts(): void {
    this.alerts[0].count = this.stats.needsRepair;
    this.alerts[0].message = `${this.stats.needsRepair} dispositivo${this.stats.needsRepair !== 1 ? 's' : ''} requiere${this.stats.needsRepair === 1 ? '' : 'n'} atención`;

    this.alerts[1].count = this.stats.occupied;
    this.alerts[1].message = `${this.stats.occupied} dispositivo${this.stats.occupied !== 1 ? 's' : ''} en uso`;
  }

  /**
   * Carga datos del usuario autenticado para mostrar en el dashboard
   *
   * @return void
   */
  private loadUser(): void {
    this.user = this.authService.getCurrentUser();
    console.log('👤 Usuario en Dashboard:', this.user);
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
   * Obtener estado de la clase CSS para el estado de la orden
   * @param status
   * @returns
   */
  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'badge-success',
      'in-progress': 'badge-warning',
      pending: 'badge-info',
      cancelled: 'badge-error',
    };
    return statusMap[status] || 'badge-ghost';
  }

  /**
   * Obtener texto para estado
   * @param status Estado del dispositivo
   * @returns Texto correspondiente
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'Completado',
      'in-progress': 'En Progreso',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
    };
    return statusMap[status] || status;
  }

  /**
   * Obtener ícono para tendencia
   * @param trend Valor de tendencia
   * @returns Ícono correspondiente
   */
  getTrendIcon(trend: number): string {
    return trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
  }

  /**
   * Obtener clase CSS para tendencia
   * @param trend Valor de tendencia
   * @returns Clase CSS correspondiente
   */
  getTrendClass(trend: number): string {
    return trend > 0
      ? 'text-success'
      : trend < 0
        ? 'text-error'
        : 'text-base-content';
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
    console.log('🔄 Refrescando datos...');
    this.loadDashboardData();
  }
}
