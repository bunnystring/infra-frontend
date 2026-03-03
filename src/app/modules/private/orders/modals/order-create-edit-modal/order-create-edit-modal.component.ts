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
  standalone: true,
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

  constructor(
    private devicesService: DevicesService,
    private groupsService: GroupsService,
    private employeesService: EmployeesService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private ordersService: OrdersService,
  ) {}

  ngOnInit() {
    this.initParameters();
    this.initForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['order'] && !changes['order'].firstChange) {
      this.initParameters();
      this.initForm();
      this.filterDevices();
    }
  }

  /**
   * Inicializa los parámetros necesarios para el formulario, cargando dispositivos, grupos y empleados desde sus respectivos servicios.
   * Luego, si hay dispositivos cargados, realiza una consulta adicional para obtener el estado de asignación activa de cada dispositivo y actualizar la lista de dispositivos con esta información.
   * Finalmente, actualiza el estado del componente con los datos cargados y filtrados, y fuerza la detección de cambios para reflejar los cambios en la interfaz de usuario.
   * @returns void
   */
  private initParameters(): void {
    forkJoin([
      this.devicesService.getAllDevices(),
      this.groupsService.getAllGroups(),
      this.employeesService.getAllEmployees(),
    ])
      .pipe(
        tap(([devices, groups, employees]) => {
          // Guarda los resultados de los servicios
          this.devices = devices;
          this.groups = groups;
          this.employees = employees;
          this.filterDevices();
          this.cd.detectChanges();
        }),
        switchMap(([devices, groups, employees]) => {
          if (devices.length > 0) {
            const rq: DevicesBatchRq = {
              ids: devices.map((device) => device.id),
            };
            return this.devicesService.hasActiveAssignmentBatch(rq).pipe(
              map((assignments) => {
                const newDevices = devices.map((device): Device => {
                  const found = assignments.find(
                    (a) => a.deviceId === device.id,
                  );
                  return {
                    ...device,
                    assignmentActive: found ? found.active : false,
                    selected: false,
                  } as Device;
                });
                const filteredDevices = this.validateDevices(newDevices);
                return [filteredDevices, groups, employees] as [
                  Device[],
                  any,
                  any,
                ];
              }),
            );
          } else {
            return of([[], groups, employees] as [Device[], any, any]);
          }
        }),
        tap(([devices, groups, employees]) => {
          this.groups = this.validateGroups(groups);
          this.employees = employees;
          this.filterDevices();
          this.cd.detectChanges();
        }),
      )
      .subscribe(([devices, groups, employees]) => {
        this.devices = devices;
        this.groups = this.validateGroups(groups);
        this.employees = employees;
        this.filterDevices();
        this.cd.detectChanges();
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

    // Validación: si es edición, verifica que haya cambios
    if (this.order && !this.hasChanges()) {
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
   * Obtiene el nombre del dispositivo a partir de su ID, buscando en la lista de dispositivos cargada en el componente. Si no se encuentra el dispositivo, devuelve 'Sin nombre'.
   * Se utiliza para mostrar el nombre del dispositivo en la interfaz de usuario a partir de su ID almacenada en la orden.
   * @param deviceId El ID del dispositivo.
   * @returns El nombre del dispositivo o 'Sin nombre' si no se encuentra.
   */
  getDeviceName(deviceId: string): string {
    const device = this.devices.find((d) => d.id === deviceId);
    return device ? device.name : 'Sin nombre';
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
    return devices
      .filter((d) => !d.assignmentActive)
      .filter((d) => d.status === DeviceStatus.GOOD_CONDITION);
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
    return (
      current.description !== this.order.description ||
      current.devicesIds !== this.order.items ||
      current.assigneesIds !== this.order.assigneeId ||
      current.assigneeType !== this.order.assigneeType
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
        group.employees.some((employee) => employee.status === EmployeeStatus.ACTIVE),
    );
  }
}
