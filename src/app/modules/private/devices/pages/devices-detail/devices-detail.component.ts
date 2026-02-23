import { Component, OnInit, OnDestroy } from '@angular/core';
import { DevicesService } from '../../services/devices.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Device, DeviceAssignment } from '../../models/device.model';
import {
  Subject,
  Observable,
  switchMap,
  tap,
  of,
  takeUntil,
  finalize,
  catchError,
  forkJoin,
  concatMap,
  map,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { OrdersService } from '../../../orders/services/orders.service';
import { LoadingService } from '../../../../../core/services/loading.service';

@Component({
  selector: 'app-devices-detail',
  templateUrl: './devices-detail.component.html',
  styleUrls: ['./devices-detail.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DevicesDetailComponent implements OnInit, OnDestroy {
  // Observables para el dispositivo y su historial de asignaciones
  device$: Observable<Device | null> = of();
  deviceAssignments$: Observable<DeviceAssignment[]> = of([]);
  viewModel$: Observable<{
    device: Device | null;
    assignments: DeviceAssignment[];
  }> = of({
    device: null,
    assignments: [],
  });

  // Estado de carga y error
  loading = false;
  error = '';

  // Observable para el estado de carga global, se puede usar para mostrar un spinner global mientras se cargan los dispositivos
  get loading$() {
    return this.loadingService.loading$;
  }

  // Subject para manejar la destrucción del componente y evitar fugas de memoria
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private devicesService: DevicesService,
    private location: Location,
    private ordersService: OrdersService,
    private router: Router,
    private loadingService: LoadingService,
  ) {}

  /**
   * Inicializa el componente
   * Llama a initParams para configurar los observables del dispositivo y su historial de asignaciones basado en el ID del dispositivo obtenido de la ruta
   * Maneja el estado de carga y errores durante la obtención de datos
   * @returns void
   */
  ngOnInit() {
    this.initParams();
  }

  /**
   * Inicializa los parámetros del componente
   * Configura los observables para obtener el dispositivo y su historial de asignaciones basado en el ID del dispositivo obtenido de la ruta
   * Maneja el estado de carga y errores durante la obtención de datos
   * @returns void
   */
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
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        if (result) {
          this.device$ = of(result.device);
          this.deviceAssignments$ = of(result.assignments);
        }
      });
  }

  /**
   * Obtiene un dispositivo por su ID junto con su historial de asignaciones
   * Llama al servicio para obtener el dispositivo y su historial de asignaciones utilizando el ID del dispositivo
   * Maneja errores y actualiza el estado de carga
   * @param deviceId ID del dispositivo a obtener
   * @returns Observable con el dispositivo y su historial de asignaciones
   */
  private getDeviceAndAssignments(deviceId: string) {
    return forkJoin({
      device: this.devicesService.getDeviceById(deviceId).pipe(
        catchError((err) => {
          this.error = err?.error?.message || 'Error al cargar dispositivo';
          return of(null);
        }),
      ),
      assignments: this.devicesService
        .getDeviceAssignmentHistory(deviceId)
        .pipe(catchError(() => of([]))),
    }).pipe(
      finalize(() => {
        this.loading = false;
      }),
    );
  }

  /**
   * Enriquece las asignaciones de un dispositivo con el nombre de la orden relacionada
   * Para cada asignación, obtiene la orden relacionada por su ID y agrega el nombre de la orden a la asignación
   * Si no se encuentra la orden, se marca como no encontrada y se muestra un ID corto en su lugar
   * @param assignments
   * @param device
   * @returns
   */
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
        // No busques la orden si no hay orderId
        if (!a.orderId) {
          return of({
            ...a,
            orderName: this.getShortId(a.orderId || ''),
            orderFound: false,
          });
        }
        // Buscas la orden si sí hay orderId válido
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

  /** Limpia los recursos del componente al destruirlo
   * Completa el Subject destroy$ para cancelar cualquier suscripción activa y evitar fugas de memoria
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Navega a la página anterior utilizando el servicio Location de Angular
   * Permite al usuario volver a la lista de dispositivos o a la página desde donde accedió al detalle del dispositivo
   * @returns void
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Formatear UUID corto (primeros 8 caracteres)
   * @param id UUID completo
   * @returns UUID truncado
   */
  getShortId(id: string): string {
    return id.substring(0, 8);
  }

  /**
   * Navega al detalle de la orden relacionada a una asignación de dispositivo
   * @param orderId ID de la orden a la que se desea navegar
   * @returns void
   */
  goDetailOrder(orderId: string): void {
    if (!orderId) return;
    this.router.navigate(['/app/orders/', orderId]);
  }

  /**
   * Refresca los datos del dispositivo y su historial de asignaciones
   * Vuelve a llamar a initParams para recargar la información desde el backend, útil después de realizar cambios en el dispositivo o sus asignaciones
   * @returns void
   */
  refreshData(): void {
    this.initParams();
  }
}
