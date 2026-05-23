import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormField, disabled, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Device, DeviceFormResult, DeviceStatus, DeviceStatusLabels } from '../../models/device.model';
import { DevicesService } from '../../services/devices.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-device-create-edit-modal',
  templateUrl: './device-create-edit-modal.component.html',
  standalone: true,
  styleUrls: ['./device-create-edit-modal.component.css'],
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceCreateEditModalComponent {
  private readonly devicesService = inject(DevicesService);

  readonly device = input<Device | null>(null);
  readonly close = output<void>();
  readonly save = output<DeviceFormResult>();

  readonly formError = signal('');
  readonly formLoading = signal(false);

  readonly DeviceStatus = DeviceStatus;
  readonly DeviceStatusLabels = DeviceStatusLabels;
  readonly deviceStatusEntries = Object.entries(DeviceStatus) as [string, DeviceStatus][];

  readonly deviceModel = linkedSignal({
    source: this.device,
    computation: (device: Device | null) => ({
      name: device?.name ?? '',
      brand: device?.brand ?? '',
      barcode: device?.barcode ?? '',
      status: device?.status ?? DeviceStatus.GOOD_CONDITION,
    }),
  });

  readonly deviceForm = form(this.deviceModel, (s) => {
    required(s.name, { message: 'Campo obligatorio.' });
    validate(s.name, ({ value }) => {
      if (!value().trim()) return { kind: 'whitespace', message: 'No debe contener solo espacios en blanco.' };
      return undefined;
    });
    disabled(s.name, () => !!this.device()?.assignmentActive);

    required(s.brand, { message: 'Campo obligatorio.' });
    validate(s.brand, ({ value }) => {
      if (!value().trim()) return { kind: 'whitespace', message: 'No debe contener solo espacios en blanco.' };
      return undefined;
    });
    disabled(s.brand, () => !!this.device()?.assignmentActive);

    required(s.barcode, { message: 'Campo obligatorio.' });
    minLength(s.barcode, 6, { message: 'Mínimo 6 caracteres.' });
    validate(s.barcode, ({ value }) => {
      if (!value().trim()) return { kind: 'whitespace', message: 'No debe contener solo espacios en blanco.' };
      return undefined;
    });
    disabled(s.barcode, () => !!this.device()?.assignmentActive);

    required(s.status, { message: 'Campo obligatorio.' });
    disabled(s.status, () => !!this.device()?.assignmentActive);
  });

  onSubmit(): void {
    submit(this.deviceForm, async () => {
      const device = this.device();
      if (device && !this.deviceForm().dirty()) {
        toast.warning('No se detectaron cambios en el dispositivo');
        return;
      }

      this.formLoading.set(true);
      this.formError.set('');
      const model = this.deviceModel();
      const isEdit = !!device;
      const op$ = device
        ? this.devicesService.updateDevice(device.id, model)
        : this.devicesService.createDevice(model);

      try {
        const saved = await firstValueFrom(op$);
        this.save.emit({ device: saved, mode: isEdit ? 'edit' : 'create' });
      } catch (err: unknown) {
        const anyErr = err as { error?: { message?: string }; message?: string };
        const msg = anyErr?.error?.message || anyErr?.message || 'Error al guardar el dispositivo';
        this.formError.set(msg);
        toast.error('Error al guardar el dispositivo', { description: msg });
      } finally {
        this.formLoading.set(false);
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
