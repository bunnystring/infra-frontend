import { Device, DevicesBatchRq, DeviceStatus } from './../../../devices/models/device.model';
import { DevicesService } from './../../../devices/services/devices.service';
import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  CreateOrderRequest,
  Order,
  OrderFormResult,
  OrderStateLabels,
  OrderStates,
} from '../../models/Orders';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import {
  forkJoin,
  Subject,
  switchMap,
  of,
  tap,
  map,
  takeUntil,
  finalize,
} from 'rxjs';
import { GroupsService } from '../../../groups/services/groups.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { Employee } from '../../../employees/models/employe.model';
import { Group } from '../../../groups/models/groups.model';
import { noWhitespaceValidator } from '../../../../../core/utils/form-validators.utils';
import { ReactiveFormsModule } from '@angular/forms';
import { OrdersService } from '../../services/orders.service';
import { toast } from 'ngx-sonner';
import { EmployeeStatus } from '../../../employees/models/employe.model';

@Component({
  selector: 'app-order-create-edit-modal',
  templateUrl: './order-create-edit-modal.component.html',
  styleUrls: ['./order-create-edit-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true
})
export class OrderCreateEditModalComponent
  implements OnInit, OnDestroy, OnChanges
{
  // Inputs y Outputs
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<OrderFormResult>();

  // Formulario y estado
  orderForm!: FormGroup;
  submitted = false;
  OrderStates = OrderStates;
  OrderStatesLabels = OrderStateLabels;
  formError = '';
  formLoading = false;

  // Para manejar desuscripciones
  private destroy$ = new Subject<void>();

  devices: Device[] = [];
  employees: Employee[] = [];
  groups: Group[] = [];
  assignedType = [
    { label: 'Empleado', value: 'EMPLOYEE' },
    { label: 'Grupo', value: 'GROUP' },
  ];

  showDeviceDropdown = false;
  deviceSearch = '';
  filteredDevices: Device[] = [];

  // Mapa para almacenar el nombre de los dispositivos por su ID, evitando llamadas repetidas a getDeviceName
  deviceNameMap: { [id: string]: string } = {};

  // Contador para verificar cuántas veces se llama a getDeviceName
  private updateDeviceNameMap() {
    this.deviceNameMap = {};
    for (const device of this.devices) {
      this.deviceNameMap[device.id] = device.name;
    }
  }

  constructor(
    private devicesService: DevicesService,
    private groupsService: GroupsService,
    private employeesService: EmployeesService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private ordersService: OrdersService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadDevices();
    this.loadGroups();
    this.loadEmployees();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['order'] && !changes['order'].firstChange) {
      this.initForm();
      this.loadDevices();
      this.loadGroups();
      this.loadEmployees();
      this.filterDevices();
    }
  }


  /**
   * Carga todos los dispositivos y verifica sus asignaciones activas
   * Primero, obtiene la lista completa de dispositivos desde el servicio de dispositivos.
   * Luego, si hay dispositivos, construye una consulta para verificar qué dispositivos tienen asignaciones activas.
   * Después, actualiza cada dispositivo con la información de si tiene una asignación activa o no.
   * Finalmente, valida la lista de dispositivos para asegurarse de que solo se muestren aquellos que están en buen estado y no tienen asignaciones activas (a menos que ya estén en la orden), y actualiza el estado del componente con esta lista filtrada.
   * @returns void
   */
  private loadDevices(): void {
    this.devicesService
      .getAllDevices()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((devices) => {
          if (!devices || devices.length === 0) {
            return of([]);
          }

          // Construir request para verificar asignaciones activas
          const rq: DevicesBatchRq = {
            ids: devices.map((device) => device.id),
          };

          return this.devicesService.hasActiveAssignmentBatch(rq).pipe(
            map((assignments) => {
              const devicesWithAssignments = devices.map((device): Device => {
                const found = assignments.find((a) => a.deviceId === device.id);
                return {
                  ...device,
                  assignmentActive: found ? found.active : false,
                  selected: false,
                } as Device;
              });

              return this.validateDevices(devicesWithAssignments);
            }),
          );
        }),
      )
      .subscribe({
        next: (devices) => {
          this.devices = devices;
          this.filterDevices();
          this.updateDeviceNameMap();
          this.cd.detectChanges();
          console.log('Dispositivos cargados:', devices.length);
        },
        error: (error) => {
          console.error('Error al cargar dispositivos:', error);
          this.devices = [];
          this.cd.detectChanges();
        },
      });
  }

  /**
   * Carga todos los grupos y los valida para asegurarse de que solo se muestren aquellos que tienen empleados activos asignados
   * Primero, obtiene la lista completa de grupos desde el servicio de grupos.
   * Luego, filtra esta lista para asegurarse de que solo se incluyan los grupos que tienen al menos un empleado activo asignado, utilizando la función validateGroups.
   * Finalmente, actualiza el estado del componente con la lista de grupos filtrada y fuerza la detección de cambios para reflejar los cambios en la interfaz de usuario.
   * @returns void
   */
  private loadGroups(): void {
    this.groupsService
      .getAllGroups()
      .pipe(
        takeUntil(this.destroy$),
        map((groups) => this.validateGroups(groups)),
      )
      .subscribe({
        next: (groups) => {
          this.groups = groups;
          this.cd.detectChanges();
          console.log('Grupos cargados:', groups.length);
        },
        error: (error) => {
          console.error('Error al cargar grupos:', error);
          this.groups = [];
          this.cd.detectChanges();
        },
      });
  }

  /**
   * Carga todos los empleados desde el servicio de empleados y actualiza el estado del componente con esta lista, manejando errores en caso de que la carga falle.
   * Primero, obtiene la lista completa de empleados desde el servicio de empleados.
   * Luego, actualiza el estado del componente con esta lista de empleados y fuerza la detección de cambios para reflejar los cambios en la interfaz de usuario.
   * Si ocurre un error durante la carga, se maneja el error registrándolo en la consola, estableciendo la lista de empleados como vacía y forzando la detección de cambios para actualizar la interfaz de usuario.
   * @returns void
   */
  private loadEmployees(): void {
    this.employeesService
      .getAllEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.cd.detectChanges();
          console.log('Empleados cargados:', employees.length);
        },
        error: (error) => {
          console.error('Error al cargar empleados:', error);
          this.employees = [];
          this.cd.detectChanges();
        },
      });
  }

  /**
   * Filtra la lista de dispositivos disponibles para asignar a la orden, excluyendo los dispositivos ya seleccionados y aplicando un filtro de búsqueda por nombre o marca.
   * Se llama cada vez que se actualiza la selección de dispositivos o el término de búsqueda, para mantener la lista de dispositivos disponibles siempre actualizada y relevante para el usuario.
   * @returns void
   */
  filterDevices() {
    const selected = this.orderForm.get('devicesIds')?.value || [];
    const search = (this.deviceSearch || '').toLowerCase().trim();
    this.filteredDevices = this.devices.filter(
      (d) =>
        !selected.includes(d.id) &&
        (!search ||
          d.name?.toLowerCase().includes(search) ||
          (d.brand && d.brand.toLowerCase().includes(search))),
    );
  }

  /**
   * Agrega un dispositivo seleccionado al formulario, actualizando la lista de dispositivos seleccionados y filtrando la lista de dispositivos disponibles para reflejar el cambio.
   * Se llama cada vez que el usuario selecciona un dispositivo del dropdown, y se encarga de mantener actualizado el estado del formulario y la lista de dispositivos disponibles para selección.
   * @returns void
   * @param deviceId
   */
  addDevice(deviceId: string) {
    const selected = this.orderForm.get('devicesIds')?.value || [];
    this.orderForm.get('devicesIds')?.setValue([...selected, deviceId]);
    this.deviceSearch = '';
    this.filterDevices();
  }

  /**
   * Elimina un dispositivo de la selección actual en el formulario, actualizando la lista de dispositivos seleccionados y filtrando la lista de dispositivos disponibles para reflejar el cambio.
   * Se llama cada vez que el usuario decide eliminar un dispositivo de la selección actual, y se encarga de mantener actualizado el estado del formulario y la lista de dispositivos disponibles para selección.
   * @returns void
   * @param deviceId
   */
  removeDevice(deviceId: string) {
    const selected = this.orderForm.controls['devicesIds'].value || [];
    this.orderForm.controls['devicesIds'].setValue(
      selected.filter((id: string) => id !== deviceId),
    );
    this.filterDevices();
  }

  /**
   * Inicializa el formulario con validaciones y valores de la orden (si existe)
   * Se llama en ngOnInit y ngOnChanges para actualizar el formulario al cambiar la orden
   * @returns void
   */
  private initForm(): void {
    this.orderForm = this.fb.group({
      description: [
        this.order?.description || '',
        [Validators.required, noWhitespaceValidator()],
      ],
      assignedType: [this.order?.assigneeType || '', [Validators.required]],
      assigneeId: [this.order?.assigneeId || '', [Validators.required]],
      devicesIds: [
        this.order?.items.map((d) => d.deviceId) || [],
        [Validators.required],
      ],
    });

    // Inicializar el filtrado de dispositivos al crear el form
    this.filterDevices();

    // Opcional: si cambia el tipo de asignación, limpia el selector correspondiente
    this.orderForm.get('assignedType')?.valueChanges.subscribe((val) => {
      this.orderForm.patchValue({ assigneeId: '' });
    });

    // Opcional: reactualiza lista filtrada de dispositivos si cambia selección
    this.orderForm.get('devicesIds')?.valueChanges.subscribe(() => {
      this.filterDevices();
    });
  }
  /**
   * Maneja el evento de envío del formulario, validando los datos y emitiendo el resultado a través del Output 'save'.
   * Si el formulario es inválido, se establece un mensaje de error y no se emite ningún evento.
   * Si el formulario es válido, se construye un objeto CreateOrderRequest con los datos del formulario y se emite a través del Output 'save'.
   * @returns void
   */
  onSubmit(): void {
    this.submitted = true;
    this.formError = '';

    // Validación: si es edición, verifica que haya cambios antes de enviar
    if (this.order?.id && !this.hasChanges()) {
      toast.warning('No se detectaron cambios en la orden');
      this.formLoading = false;
      this.cd.markForCheck();
      return;
    }
    if (this.orderForm.invalid) return;
    this.formLoading = true;
    this.cd.markForCheck();
    const formValue = this.orderForm.value;
    const isEdit = !!this.order;
    const result: CreateOrderRequest = {
      description: formValue.description.trim(),
      assigneeType: formValue.assignedType,
      assigneeId: formValue.assigneeId,
      devicesIds: formValue.devicesIds,
    };
    const op$ = this.order
      ? this.ordersService.updateOrder(this.order.id, result)
      : this.ordersService.createOrder(result);
    op$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.formLoading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (order: Order) => {
          this.save.emit({ order, mode: isEdit ? 'edit' : 'create' });
        },
        error: (err) => {
          const msg =
            err?.error?.message || err?.message || 'Error al guardar la orden';

          this.formError = msg;
          toast.error('Error al guardar la orden', {
            description: msg,
          });
        },
      });
  }

  /**
   * Maneja el cambio en el tipo de asignación (empleado o grupo), limpiando el campo de selección correspondiente para evitar inconsistencias en el formulario.
   * Se llama cada vez que el usuario cambia el valor del campo 'assignedType' en el formulario.
   * @returns void
   * @param event
   */
  onAssignedTypeChange(event: any) {
    this.orderForm.patchValue({ assigneeId: '' });
  }

  /**
   * Maneja la selección de un dispositivo desde el dropdown personalizado, agregando el ID del dispositivo seleccionado al formulario y actualizando la lista de dispositivos filtrados.
   * Se llama cada vez que el usuario selecciona un dispositivo del dropdown, y se encarga de mantener actualizado el estado del formulario y la lista de dispositivos disponibles para selección.
   * @returns void
   * @param deviceId El ID del dispositivo seleccionado.
   */
  onSeleccionarDispositivo(deviceId: string) {
    const seleccionados = this.orderForm.get('devicesIds')?.value || [];
    this.orderForm.get('devicesIds')?.setValue([...seleccionados, deviceId]);
    this.deviceSearch = '';
    this.filterDevices();
  }

  /**
   * Valida la lista de dispositivos para asegurarse de que solo se muestren aquellos que no tienen una asignación activa y que están en buen estado, filtrando la lista original de dispositivos y devolviendo solo los válidos para asignar a una orden.
   * Se utiliza para mantener la integridad de los datos y evitar que se asignen dispositivos que no están disponibles o que podrían causar problemas en la gestión de órdenes.
   * @returns Device[] - Lista de dispositivos válidos para asignar a una orden.
   */
  validateDevices(devices: Device[]): Device[] {
    const orderDeviceIds =
      this.order?.items.map((i) => String(i.deviceId)) || [];
    return devices.filter((d) => {
      const isInOrder = orderDeviceIds.includes(String(d.id));
      if (isInOrder) return true;
      return d.status === DeviceStatus.GOOD_CONDITION && !d.assignmentActive;
    });
  }

  /**
   * Verifica si hay cambios en el formulario comparado con los valores originales de la orden
   * Si no hay orden (creación), siempre retorna true para permitir el envío
   * Compara cada campo del formulario con la orden original para detectar cambios
   * @returns boolean - true si hay cambios, false si no hay cambios
   */
  private hasChanges(): boolean {
    if (!this.order) return true;

    const current = this.orderForm.value;
    const originalDevicesIds = this.order.items.map((d) => d.deviceId).sort();
    const currentDevicesIds = (current.devicesIds || []).sort();

    // Comparar descripción
    const descriptionChanged =
      current.description?.trim() !== this.order.description;

    // Comparar tipo de asignación
    const assignedTypeChanged =
      current.assignedType !== this.order.assigneeType;

    // Comparar ID del asignado
    const assigneeIdChanged = current.assigneeId !== this.order.assigneeId;

    // Comparar dispositivos (arrays)
    const devicesChanged =
      originalDevicesIds.length !== currentDevicesIds.length ||
      !originalDevicesIds.every((id, index) => id === currentDevicesIds[index]);

    return (
      descriptionChanged ||
      assignedTypeChanged ||
      assigneeIdChanged ||
      devicesChanged
    );
  }

  /**
   * Valida la lista de grupos para asegurarse de que solo se muestren aquellos que tienen empleados activos asignados, filtrando la lista original de grupos y devolviendo solo los válidos para asignar a una orden.
   * Se utiliza para mantener la integridad de los datos y evitar que se asignen grupos que no tienen empleados activos, lo que podría causar problemas en la gestión de órdenes.
   * @param groups - Lista de grupos a validar.
   * @returns Group[] - Lista de grupos válidos para asignar a una orden.
   */
  validateGroups(groups: Group[]): Group[] {
    return groups.filter(
      (group) =>
        Array.isArray(group.employees) &&
        group.employees.some(
          (employee) => employee.status === EmployeeStatus.ACTIVE,
        ),
    );
  }
}
