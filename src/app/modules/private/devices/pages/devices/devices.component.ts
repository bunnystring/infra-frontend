import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Subject,
  takeUntil,
  BehaviorSubject,
  Observable,
  combineLatest,
  startWith,
  map,
  tap,
} from 'rxjs';
import {
  Device,
  DeviceStatus,
  DeviceStatusLabels,
  DeviceStatusColors,
  DeviceFormResult,
} from '../../models/device.model';
import { toast } from 'ngx-sonner';
import { DeviceCreateEditModalComponent } from '../../modals/device-create-edit-modal/device-create-edit-modal.component';
import { LoadingService } from '../../../../../core/services/loading.service';
import { DevicesService } from '../../services/devices.service';
import { DeviceDeleteModalComponent } from '../../modals/device-delete-modal/device-delete-modal.component';
import { DeviceBulkUploadModalComponent } from '../../modals/device-bulk-upload-modal/device-bulk-upload-modal.component';

@Component({
  selector: 'app-devices',
  imports: [
    CommonModule,
    FormsModule,
    DeviceCreateEditModalComponent,
    DeviceDeleteModalComponent,
    DeviceBulkUploadModalComponent,
  ],
  standalone: true,
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
})
export class DevicesComponent implements OnInit, OnDestroy {
  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  // Dispositivo seleccionado para editar o eliminar
  deviceToEdit: Device | null = null;
  deviceToDelete: Device | null = null;

  // Modo del formulario: 'create' o 'edit'
  formMode: 'create' | 'edit' = 'create';

  // Estado de carga y error
  submitted = false;
  deviceErrorMessage = '';
  isRetrying = false;
  deviceError = false;

  // Filtros como BehaviorSubject
  search$ = new BehaviorSubject<string>('');
  statusFilter$ = new BehaviorSubject<DeviceStatus | 'ALL'>('ALL');

  // Mapas para etiquetas y colores de estado
  get search(): string {
    return this.search$.value;
  }

  // Getters y Setters para filtros
  set search(val: string) {
    this.search$.next(val);
  }

  // El filtro de estado puede ser un DeviceStatus o 'ALL' para mostrar todos
  get statusFilter(): DeviceStatus | 'ALL' {
    return this.statusFilter$.value;
  }

  // El setter actualiza el BehaviorSubject para que los observables dependientes se actualicen automáticamente
  set statusFilter(val: DeviceStatus | 'ALL') {
    this.statusFilter$.next(val);
  }

  // Observable para el estado de carga global, se puede usar para mostrar un spinner global mientras se cargan los dispositivos
  get loading$() {
    return this.loadingService.loading$;
  }

  // Fuente de datos principal de dispositivos, se actualiza al cargar o modificar dispositivos
  devices$ = new BehaviorSubject<Device[]>([]);

  // Mapas para etiquetas y colores de estado
  DeviceStatus = DeviceStatus;
  DeviceStatusLabels = DeviceStatusLabels;
  DeviceStatusColors = DeviceStatusColors;

  // Subject para manejar la destrucción del componente y evitar fugas de memoria
  private readonly destroy$ = new Subject<void>();

  // Stats locales
  stats = {
    totalDevices: 0,
    goodCondition: 0,
    occupied: 0,
    needsRepair: 0,
    fair: 0,
  };

  // Paginación
  page = 1;
  pageSize = 10;
  totalItems = 0;

  // Observable de dispositivos filtrados según los filtros de búsqueda y estado
  get pagedDevices$(): Observable<Device[]> {
    return this.filteredDevices$.pipe(
      map((devices) =>
        devices.slice(
          (this.page - 1) * this.pageSize,
          this.page * this.pageSize,
        ),
      ),
    );
  }

  // Control para mostrar el modal de carga masiva
  showBulkUploadModal = false;

  constructor(
    private devicesService: DevicesService,
    private loadingService: LoadingService,
    private router: Router,
  ) {}

  /**
   * Inicializa el componente - carga los dispositivos y configura el formulario
   * Se llama automáticamente al crear el componente
   * @returns void
   */
  ngOnInit(): void {
    this.loadDevices();
  }

  /**
   * Limpia recursos al destruir el componente - se llama automáticamente al destruir el componente
   * Completa el Subject para evitar fugas de memoria en los observables
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los dispositivos desde el servicio y actualiza el estado local
   * Muestra un toast de error si la carga falla
   * @returns void
   */
  loadDevices(): void {
    this.deviceErrorMessage = '';
    this.deviceError = false;
    this.devicesService
      .getAllDevices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (devices) => {
          this.devices$.next(devices);
        },
        error: (error) => {
          toast.error('Error al obtener dispositivos', {
            description: error.message || '',
          });
          this.deviceError = true;
          this.deviceErrorMessage =
            error.message || 'Error al cargar dispositivos';
          this.devices$.next([]);
          this.isRetrying = false;
        },
      });
  }

  retryLoadData(): void {
    this.isRetrying = true;
    this.loadDevices();
  }

  /**
   * filtra los dispositivos según los filtros de búsqueda y estado
   * Combina los observables de dispositivos, búsqueda y filtro de estado para producir una lista filtrada de dispositivos
   * Se actualiza automáticamente cuando cambian los dispositivos o los filtros
   * @returns Observable<Device[]> Lista de dispositivos filtrados
   */
  filteredDevices$: Observable<Device[]> = combineLatest([
    this.devices$,
    this.search$.pipe(startWith('')),
    this.statusFilter$.pipe(startWith('ALL')),
  ]).pipe(
    map(([devices, search, filter]) =>
      devices.filter(
        (d) =>
          this.matchSearch(d, search) &&
          (filter === 'ALL' || d.status === filter),
      ),
    ),
    tap((devices) => (this.totalItems = devices.length)),
  );

  /**
   * Calcula estadísticas de dispositivos filtrados para mostrar en la UI
   * Se actualiza automáticamente cuando cambia la lista de dispositivos filtrados
   * @returns Observable<{ totalDevices: number; goodCondition: number; occupied: number; needsRepair: number; fair: number }>
   * Objeto con el total de dispositivos y el conteo por estado
   */
  filteredStats$: Observable<{
    totalDevices: number;
    goodCondition: number;
    occupied: number;
    needsRepair: number;
    fair: number;
  }> = this.filteredDevices$.pipe(
    map((devices) => ({
      totalDevices: devices.length,
      goodCondition: devices.filter(
        (d) => d.status === DeviceStatus.GOOD_CONDITION,
      ).length,
      occupied: devices.filter((d) => d.status === DeviceStatus.OCCUPIED)
        .length,
      needsRepair: devices.filter((d) => d.status === DeviceStatus.NEEDS_REPAIR)
        .length,
      fair: devices.filter((d) => d.status === DeviceStatus.FAIR).length,
    })),
  );

  /**
   * Actualiza el filtro de búsqueda con el valor ingresado por el usuario   * El setter del filtro de búsqueda actualiza el BehaviorSubject para que los dispositivos filtrados se actualicen automáticamente
   * @param value Valor de búsqueda ingresado por el usuario
   */
  onSearchChange(value: string): void {
    this.page = 1;
    this.search = value || '';
  }

  /**
   * Actualiza el filtro de estado con el valor seleccionado por el usuario
   * El setter del filtro de estado actualiza el BehaviorSubject para que los dispositivos filtrados se actualicen automáticamente
   * @param value Valor de estado seleccionado por el usuario (DeviceStatus o 'ALL')
   */
  filterByStatus(status: DeviceStatus | 'ALL'): void {
    this.page = 1;
    this.statusFilter = status;
  }

  /** Restablece los filtros de búsqueda y estado a sus valores predeterminados
   * El setter de cada filtro actualiza su BehaviorSubject correspondiente para que los dispositivos filtrados se actualicen automáticamente
   * @returns void
   */
  resetFilters(): void {
    this.page = 1;
    this.search = '';
    this.statusFilter = 'ALL';
  }

  /** Verifica si un dispositivo coincide con el texto de búsqueda en su nombre, marca o código de barras
   * @param device Dispositivo a verificar
   * @param search Texto de búsqueda ingresado por el usuario
   * @returns boolean Verdadero si el dispositivo coincide con la búsqueda, falso en caso contrario
   */
  private matchSearch(device: Device, search: string): boolean {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      device.name.toLowerCase().includes(lower) ||
      device.brand.toLowerCase().includes(lower) ||
      device.barcode.toLowerCase().includes(lower)
    );
  }

  /** Abre el modal para crear un nuevo dispositivo
   * Configura el modo del formulario a 'create', resetea el formulario y muestra el modal de creación
   * @returns void
   */
  openCreateModal(): void {
    this.formMode = 'create';
    this.deviceToEdit = null;
    this.showCreateModal = true;
    this.showEditModal = false;
  }

  /** Abre el modal para editar un dispositivo existente
   * Configura el modo del formulario a 'edit', carga los datos del dispositivo seleccionado en el formulario y muestra el modal de edición
   * @param device Dispositivo a editar
   * @returns void
   */
  openEditModal(device: Device): void {
    this.formMode = 'edit';
    this.deviceToEdit = device;
    this.showEditModal = true;
    this.showCreateModal = false;
  }

  /**
   * Abre el modal para confirmar la eliminación de un dispositivo
   * Configura el dispositivo a eliminar y muestra el modal de eliminación
   * @param device Dispositivo a eliminar
   * @returns void
   */
  openDeleteModal(device: Device): void {
    this.deviceToDelete = device;
    this.showDeleteModal = true;
  }

  /**
   * Confirma la eliminación del dispositivo
   * Llama al servicio para eliminar el dispositivo por su ID
   * Muestra un toast de éxito o error según corresponda
   */
  onDeviceDeleted(): void {
    this.showDeleteModal = false;
    this.deviceToDelete = null;
    this.loadDevices();
  }

  /**
   * Cancela la eliminación y cierra el modal
   * Emite un evento de cancelación para que el componente padre pueda manejarlo
   * @returns void
   */
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deviceToDelete = null;
  }

  /**
   * Cierra todos los modales y limpia el estado relacionado con la edición y eliminación de dispositivos
   * Resetea los flags de visibilidad de los modales, limpia los dispositivos seleccionados para edición y eliminación, y restablece el estado del formulario
   * @returns void
   */
  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.deviceToEdit = null;
    this.deviceToDelete = null;
  }

  /**
   * Maneja el resultado del formulario de creación/edición de dispositivo
   * Muestra un toast de éxito, recarga la lista de dispositivos y cierra los modales
   * @param result Resultado del formulario que incluye el dispositivo creado/actualizado y el modo de operación (crear o editar)
   * @returns void
   */
  handleModalSave({ device, mode }: DeviceFormResult): void {
    toast.success(
      mode === 'create' ? 'Dispositivo creado' : 'Dispositivo actualizado',
    );
    this.loadDevices();
    this.closeModals();
  }

  /** Limpia el mensaje de error
   * @returns void
   */
  clearError(): void {
    this.deviceErrorMessage = '';
  }

  /** Devuelve la clase CSS para el badge de estado según el estado del dispositivo
   * Utiliza el mapa DeviceStatusColors para asignar un color específico a cada estado
   * Agrega la clase 'capitalize' para mostrar el texto con la primera letra en mayúscula
   * @param status Estado del dispositivo
   * @returns string Clase CSS para el badge de estado
   */
  getStatusBadge(status: DeviceStatus): string {
    return `badge ${DeviceStatusColors[status]} capitalize`;
  }

  /** Navega a la página de detalle del dispositivo seleccionado
   * Utiliza el router de Angular para navegar a la ruta de detalle del dispositivo, pasando el ID del dispositivo como parámetro
   * @param device Dispositivo seleccionado para ver su detalle
   * @returns void
   */
  goToDetail(device: Device): void {
    this.router.navigate(['/app/devices', device.id]);
  }

  /**
   * Calcula el número total de páginas para la paginación según el total de dispositivos filtrados y el tamaño de página
   * Utiliza la propiedad totalItems, que se actualiza automáticamente cuando cambia la lista de dispositivos filtrados, para calcular el total de páginas
   * @returns number Número total de páginas para la paginación
   */
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  /**
   * Abre el modal de carga masiva de dispositivos
   * Configura el flag para mostrar el modal de carga masiva
   * @returns void
   */
  openBulkUploadModal() {
    this.showBulkUploadModal = true;
  }

  /**
   * Cierra el modal de carga masiva de dispositivos
   * Configura el flag para ocultar el modal de carga masiva
   * @returns void
   */
  closeBulkUploadModal() {
    this.showBulkUploadModal = false;
  }

  /**
   * Maneja el resultado exitoso de la carga masiva de dispositivos
   * Muestra un toast con el número de dispositivos cargados, recarga la lista de dispositivos y cierra el modal de carga masiva
   * @param uploadedDevices Dispositivos que fueron cargados exitosamente
   */
  onBulkUploadSuccess(uploadedDevices: Device[]) {
    toast.success(
      `${uploadedDevices.length} dispositivos cargados exitosamente`,
    );
    this.loadDevices();
    this.closeBulkUploadModal();
  }

  /**
   * Refrescar datos del dashboard después de una acción que pueda haber cambiado el estado de los dispositivos u órdenes
   * @returns
   * void
   */
  refreshData(): void {
    this.loadDevices();
  }
}
