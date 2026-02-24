import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Device,
  DeviceStatus,
  DeviceStatusLabels,
  DeviceFormResult,
} from '../../models/device.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { DevicesService } from '../../services/devices.service';
import { noWhitespaceValidator } from '../../../../../core/utils/form-validators.utils';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-device-create-edit-modal',
  templateUrl: './device-create-edit-modal.component.html',
  standalone: true,
  styleUrls: ['./device-create-edit-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceCreateEditModalComponent
  implements OnInit, OnChanges, OnDestroy
{
  // Inputs y Outputs
  @Input() device: Device | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<DeviceFormResult>();

  // Formulario y estado
  deviceForm!: FormGroup;
  submitted = false;
  DeviceStatus = DeviceStatus;
  DeviceStatusLabels = DeviceStatusLabels;
  formError = '';
  formLoading = false;

  // Para manejar desuscripciones
  private destroy$ = new Subject<void>();

  // Para iterar sobre los estados en el template
  public deviceStatusEntries = Object.entries(DeviceStatus) as [
    string,
    DeviceStatus,
  ][];

  constructor(
    private fb: FormBuilder,
    private devicesService: DevicesService,
    private cd: ChangeDetectorRef,
  ) {}

  /**
   * Inicializa el formulario con validaciones y valores del dispositivo (si existe)
   * Se llama en ngOnInit y ngOnChanges para actualizar el formulario al cambiar el dispositivo
   * @returns void
   */
  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Limpia recursos al destruir el componente
   * @returns void
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Detecta cambios en el input 'device' para actualizar el formulario con los nuevos valores
   * Si el dispositivo cambia (y no es la primera vez), se reinicializa el formulario con los nuevos datos
   * @param changes Cambios detectados en los inputs
   * @returns void
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['device'] && !changes['device'].firstChange) {
      this.initForm();
    }
  }

  /** Inicializa el formulario con validaciones y valores del dispositivo (si existe)
   * @returns void
   */
  private initForm(): void {
    this.deviceForm = this.fb.group({
      name: [
        this.device?.name || '',
        [Validators.required, noWhitespaceValidator()],
      ],
      brand: [
        this.device?.brand || '',
        [Validators.required, noWhitespaceValidator()],
      ],
      barcode: [
        this.device?.barcode || '',
        [Validators.required, Validators.minLength(6), noWhitespaceValidator()],
      ],
      status: [
        this.device?.status || DeviceStatus.GOOD_CONDITION,
        Validators.required,
      ],
    });
    // Si el dispositivo está asignado, deshabilita el formulario para evitar cambios
    if (this.device?.assignmentActive) {
      this.deviceForm.disable();
    } else {
      this.deviceForm.enable();
    }
    this.submitted = false;
    this.formError = '';
    this.formLoading = false;
  }

  /**
   * Envía el formulario para crear o actualizar un dispositivo
   * Determina si se está creando o editando por la presencia de this.device
   * Muestra un spinner mientras se procesa la solicitud y maneja errores
   * @returns void
   */
  submit(): void {
    this.submitted = true;
    this.formError = '';

    // Validación: si es edición, verifica que haya cambios
    if (this.device && !this.hasChanges()) {
      toast.warning('No se detectaron cambios en el dispositivo');
      this.formLoading = false;
      this.cd.markForCheck();
      return;
    }

    if (this.deviceForm.invalid) return;

    this.formLoading = true;
    this.cd.markForCheck();
    const value = this.deviceForm.value;
    const isEdit = !!this.device;
    const op$ = this.device
      ? this.devicesService.updateDevice(this.device.id, value)
      : this.devicesService.createDevice(value);

    op$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.formLoading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (device: Device) => {
          this.save.emit({ device, mode: isEdit ? 'edit' : 'create' });
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al guardar el dispositivo';

          this.formError = msg;
          toast.error('Error al guardar el dispositivo', {
            description: msg,
          });
        },
      });
  }

  /**
   * Emite el evento de cierre del modal para que el componente padre lo oculte
   * @returns void
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Verifica si hay cambios en el formulario comparado con los valores originales del dispositivo
   * Si no hay dispositivo (creación), siempre retorna true para permitir el envío
   * Compara cada campo del formulario con el dispositivo original para detectar cambios
   * @returns boolean - true si hay cambios, false si no hay cambios
   */
  private hasChanges(): boolean {
    if (!this.device) return true;
    const current = this.deviceForm.value;
    return (
      current.name !== this.device.name ||
      current.brand !== this.device.brand ||
      current.barcode !== this.device.barcode ||
      current.status !== this.device.status
    );
  }

  /** Inicia el estado de carga del formulario y deshabilita los campos para evitar cambios durante la operación
   * Detiene el estado de carga y habilita los campos del formulario después de la operación
   * Limpia el mensaje de error para que no persista en operaciones futuras
   * @returns void
   */
  startFormLoading(): void {
    this.formLoading = true;
    this.deviceForm.disable();
  }

  /** Detiene el estado de carga del formulario y habilita los campos para permitir cambios después de la operación
   * @returns void
   */
  stopFormLoading(): void {
    this.formLoading = false;
    this.deviceForm.enable();
  }
}
