import { Device } from './../../../devices/models/device.model';
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
  Order,
  OrderFormResult,
  OrderStateLabels,
  OrderStates,
} from '../../models/Orders';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, Validators } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { GroupsService } from '../../../groups/services/groups.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { Employee } from '../../../employees/models/employe.model';
import { Group } from '../../../groups/models/groups.model';
import { noWhitespaceValidator } from '../../../../../core/utils/form-validators.utils';
import { ReactiveFormsModule } from '@angular/forms';

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
   * Inicializa los parámetros necesarios para el formulario, como listas de dispositivos, grupos y empleados, a partir de los servicios correspondientes.
   * Esta función se llama tanto en ngOnInit como en ngOnChanges para asegurar que los datos estén actualizados al abrir el modal o al cambiar la orden a editar.
   * @returns void
   */
  private initParameters(): void {
    forkJoin([
      this.devicesService.getAllDevices(),
      this.groupsService.getAllGroups(),
      this.employeesService.getAllEmployees(),
    ]).subscribe(([devices, groups, employees]) => {
      this.devices = devices;
      this.groups = groups;
      this.employees = employees;
      this.filterDevices();
      this.cd.detectChanges();
    });
  }

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

  addDevice(deviceId: string) {
    const selected = this.orderForm.get('devicesIds')?.value || [];
    this.orderForm.get('devicesIds')?.setValue([...selected, deviceId]);
    this.deviceSearch = '';
    this.filterDevices();
  }

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
   * Si el formulario es válido, se construye un objeto OrderFormResult con los datos del formulario y se emite a través del Output 'save'.
   * @returns void
   */
  onSubmit(): void {
    this.submitted = true;
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
}
