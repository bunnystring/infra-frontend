import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Device, DeviceFormResult, DeviceStatus, DeviceStatusLabels } from '../../models/device.model';
import { DevicesService } from '../../services/devices.service';
import { noWhitespaceValidator } from '../../../../../core/utils/form-validators.utils';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-device-create-edit-modal',
  templateUrl: './device-create-edit-modal.component.html',
  standalone: true,
  styleUrls: ['./device-create-edit-modal.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceCreateEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly devicesService = inject(DevicesService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly device = input<Device | null>(null);
  readonly close = output<void>();
  readonly save = output<DeviceFormResult>();

  deviceForm!: FormGroup;
  readonly submitted = signal(false);
  readonly formError = signal('');
  readonly formLoading = signal(false);

  readonly DeviceStatus = DeviceStatus;
  readonly DeviceStatusLabels = DeviceStatusLabels;
  readonly deviceStatusEntries = Object.entries(DeviceStatus) as [string, DeviceStatus][];

  constructor() {
    // Re-initialize form when device input changes after first render
    effect(() => {
      this.device();
      untracked(() => { if (this.deviceForm) this.initForm(); });
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const device = this.device();
    this.deviceForm = this.fb.group({
      name: [device?.name ?? '', [Validators.required, noWhitespaceValidator()]],
      brand: [device?.brand ?? '', [Validators.required, noWhitespaceValidator()]],
      barcode: [device?.barcode ?? '', [Validators.required, Validators.minLength(6), noWhitespaceValidator()]],
      status: [device?.status ?? DeviceStatus.GOOD_CONDITION, Validators.required],
    });
    if (device?.assignmentActive) {
      this.deviceForm.disable();
    } else {
      this.deviceForm.enable();
    }
    this.submitted.set(false);
    this.formError.set('');
    this.formLoading.set(false);
  }

  submit(): void {
    this.submitted.set(true);
    this.formError.set('');

    const device = this.device();
    if (device && !this.hasChanges()) {
      toast.warning('No se detectaron cambios en el dispositivo');
      this.cd.markForCheck();
      return;
    }

    if (this.deviceForm.invalid) return;

    this.formLoading.set(true);
    this.cd.markForCheck();
    const value = this.deviceForm.value;
    const isEdit = !!device;
    const op$ = device
      ? this.devicesService.updateDevice(device.id, value)
      : this.devicesService.createDevice(value);

    op$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.formLoading.set(false);
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (saved: Device) => {
          this.save.emit({ device: saved, mode: isEdit ? 'edit' : 'create' });
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al guardar el dispositivo';
          this.formError.set(msg);
          toast.error('Error al guardar el dispositivo', { description: msg });
        },
      });
  }

  closeModal(): void {
    this.close.emit();
  }

  private hasChanges(): boolean {
    const device = this.device();
    if (!device) return true;
    const current = this.deviceForm.value;
    return (
      current.name !== device.name ||
      current.brand !== device.brand ||
      current.barcode !== device.barcode ||
      current.status !== device.status
    );
  }
}
