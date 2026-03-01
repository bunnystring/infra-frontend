import { DevicesBatchRq } from './../../../devices/models/device.model';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { OrdersService } from '../../services/orders.service';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../../../core/services/loading.service';
import {
  tap,
  catchError,
  takeUntil,
  switchMap,
  of,
  concatMap,
} from 'rxjs';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import {
  Order,
  OrderStates,
  OrderStatusColors,
} from '../../models/Orders';
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
  imports: [CommonModule],
})
export class OrdersDetailComponent implements OnInit, OnDestroy {
  // Modelo de vista para la orden
  order: Order | null = null;

  // Estado de error
  error: string = '';

  // Observable para el estado de carga
  get loading$() {
    return this.loadingService.loading$;
  }

  // Obtener la etiqueta legible para el estado del dispositivo
  getDeviceStatusLabel(status: string | undefined | null): string {
    return status && DeviceStatusLabels[status as DeviceStatus]
      ? DeviceStatusLabels[status as DeviceStatus]
      : '-';
  }

  // Obtener la clase CSS para el color del estado del dispositivo
  getDeviceStatusColor(status: string | undefined | null): string {
    return (
      'badge-' +
      (status && DeviceStatusColors[status as DeviceStatus]
        ? DeviceStatusColors[status as DeviceStatus]
        : 'secondary')
    );
  }

  // Obtener la clase CSS para el color del estado de la orden
  getOrderStateBadge(state?: OrderStates| null): string {
    console.log('Estado de la orden:', state, 'Clase CSS:', 'badge badge-' + (state && OrderStatusColors[state] ? OrderStatusColors[state] : 'neutral') + ' text-xl p-4');
    return (
      'badge badge-' +
      (state && OrderStatusColors[state] ? OrderStatusColors[state] : 'neutral') +
      ' text-xl p-4'
    );
  }

  // Obtener la etiqueta legible para el estado de la orden
  getOrderStateLabel(state?: OrderStates | null): string {
    return (state ? OrderStates[state] : '-') ?? '-';
  }

  // Obtener el estado del dispositivo para mostrar en la plantilla, para mostar el nombre del estado en vez del código
  DeviceStatusLabels = DeviceStatusLabels;

  // Obtener el color del estado del dispositivo para usar en la plantilla
  DeviceStatusColors = DeviceStatusColors;

  // Variable para almacenar el nombre del grupo, se muestra en el tooltip del badge de grupo
  groupName: string = '';

  // Variable para almacenar el nombre del empleado, se muestra en el tooltip del badge de empleado
  get groupNameTooltip() {
    return this.groupName ? 'Grupo: ' + this.groupName : '';
  }

  // Variable para almacenar el nombre del empleado, se muestra en el tooltip del badge de empleado
  get employeeNameTooltip() {
    return this.order?.assigneeId ? 'Empleado: ' + this.order?.assigneeId : '';
  }

  // Subject para manejar la destrucción del componente y evitar fugas de memoria
  private readonly destroy$ = new Subject<void>();

  constructor(
    private location: Location,
    private ordersService: OrdersService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private devicesService: DevicesService,
    private employeeService: EmployeesService,
    private groupsService: GroupsService,
    private router: Router,
  ) {}

  /**
   * Inicializar el componente y cargar los detalles de la orden
   * Llama al método getOrderDetail para cargar los detalles de la orden cuando el componente se inicializa. Este método se suscribe a los parámetros de la ruta para obtener el ID de la orden y luego llama al servicio para obtener los detalles de la orden, manejando cualquier error que pueda ocurrir durante la carga.
   * @returns void
   */
  ngOnInit() {
    this.getOrderDetail();
  }

  /**
   * Limpiar los recursos y evitar fugas de memoria al destruir el componente
   * Emite un valor al Subject destroy$ para completar cualquier suscripción que esté escuchando este Subject, lo que ayuda a evitar fugas de memoria al asegurarse de que las suscripciones se limpien correctamente cuando el componente se destruya.
   * @returns void
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar los detalles de la orden utilizando el ID de la ruta y manejar errores.
   * Obtiene el ID de la orden desde los parámetros de la ruta, luego llama al servicio
   * para obtener los detalles de la orden y los devices asociados a cada item, si existen.
   * @returns void
   */
  getOrderDetail(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.error = '';
        }),
        switchMap((params) =>
          this.ordersService.getOrderById(params['id']).pipe(
            tap((order) => {
              this.order = order;
              console.log('Orden cargada:', order);
            }),
            catchError((err) => {
              this.error = err?.error?.message || 'Error al cargar orden';
              toast.error('Error al cargar la orden', {
                description: this.error,
              });
              this.order = null;
              return of(null);
            }),
          ),
        ),
        concatMap((order) => {
          if (order && Array.isArray(order.items) && order.items.length > 0) {
            const rq = {} as DevicesBatchRq;
            rq.ids = order.items.map((item) => item.deviceId);
            return this.devicesService.getDevicesBatch(rq).pipe(
              tap((devices) => {
                if (devices && Array.isArray(devices)) {
                  order.items.forEach((item) => {
                    item.device = devices.find(
                      (device) => device.id === item.deviceId,
                    )!;
                  });
                }
              }),
              catchError((err) => {
                console.error(
                  `Error al cargar dispositivos con IDs ${rq.ids.join(', ')}:`,
                  err,
                );
                return of(null);
              }),
            );
          } else {
            return of(null);
          }
        }),
        concatMap(() => {
          if (!this.order) return of(null);

          if (this.order.assigneeType !== 'GROUP') {
            return this.employeeService
              .getEmployeeById(this.order.assigneeId)
              .pipe(
                tap((employee) => {
                  if (this.order) {
                    this.order.assigneeId = employee.fullName;
                  }
                }),
                catchError((err) => {
                  console.error(
                    `Error al cargar empleado con ID ${this.order!.assigneeId}:`,
                    err,
                  );
                  return of(null);
                }),
              );
          } else {
            return this.groupsService.getGroupById(this.order.assigneeId).pipe(
              tap((group) => {
                if (this.order) {
                  this.order.assigneeId = group.employees?.length
                    ? `(${group.employees.length} empleados)`
                    : group.name;
                  this.groupName = group.name;
                }
              }),
              catchError((err) => {
                console.error(
                  `Error al cargar grupo con ID ${this.order!.assigneeId}:`,
                  err,
                );
                return of(null);
              }),
            );
          }
        }),
      )
      .subscribe(() => {});
  }

  /**
   * Navegar hacia atrás en la historia del navegador
   * Llama al método back del servicio Location para navegar hacia atrás en la historia del navegador, lo que permite al usuario regresar a la página anterior.
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
   * Refrescar los detalles de la orden
   * Llama al método getOrderDetail para recargar los detalles de la orden, lo que permite al usuario actualizar la información mostrada en la página.
   * @returns void
   */
  refreshData(): void {
    this.getOrderDetail();
  }

  /**
   * Ir al detalle de la asignación segun el tipo de asignación (empleado o grupo)
   * Navega al detalle del empleado o grupo asignado a la orden, dependiendo del tipo de asignación. Si la orden está asignada a un empleado, navega al detalle del empleado; si está asignada a un grupo, navega al detalle del grupo.
   * @returns void
   */
  goAsignedDetail(): void {
    switch (this.order?.assigneeType) {
      case 'EMPLOYEE':
        this.router.navigate(['/app/employees/', this.order.assigneeId]);
        break;
      case 'GROUP':
        this.router.navigate(['/app/groups/', this.order.assigneeId]);
        break;
      default:
        break;
    }
  }
}
