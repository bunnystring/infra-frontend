import { DevicesService } from './../../../devices/services/devices.service';
import { Component, OnChanges, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderFormResult, OrderStateLabels,OrderStates } from '../../models/Orders';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { GroupsService } from '../../../groups/services/groups.service';
import { EmployeesService } from '../../../employees/services/employees.service';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-order-create-edit-modal',
  templateUrl: './order-create-edit-modal.component.html',
  styleUrls: ['./order-create-edit-modal.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class OrderCreateEditModalComponent implements OnInit, OnDestroy, OnChanges {

    // Inputs y Outputs
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<OrderFormResult>();

  // Formulario y estado
  deviceForm!: FormGroup;
  submitted = false;
  OrderStates = OrderStates;
  OrderStatesLabels = OrderStateLabels;
  formError = '';
  formLoading = false;

  // Para manejar desuscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private devicesService: DevicesService,
    private groupsService: GroupsService,
    private employeesService: EmployeesService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
  ) { }

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
    }
  }

  /**
   * Inicializa los parámetros necesarios para el formulario, como listas de dispositivos, grupos y empleados, a partir de los servicios correspondientes.
   * Esta función se llama tanto en ngOnInit como en ngOnChanges para asegurar que los datos estén actualizados al abrir el modal o al cambiar la orden a editar.
   * @returns void
   */
  private initParameters(): void {

  }

  /**
   * Inicializa el formulario con validaciones y valores de la orden (si existe)
   * Se llama en ngOnInit y ngOnChanges para actualizar el formulario al cambiar la orden
   * @returns void
   */
  private initForm(): void {

  }
}
