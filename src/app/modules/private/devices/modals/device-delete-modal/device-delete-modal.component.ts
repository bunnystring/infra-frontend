import { ChangeDetectionStrategy, Component, inject, signal, input, output } from '@angular/core';
import { Device } from '../../models/device.model';
import { DevicesService } from '../../services/devices.service';
import { toast } from 'ngx-sonner';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-device-delete-modal',
  templateUrl: './device-delete-modal.component.html',
  styleUrls: ['./device-delete-modal.component.css'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceDeleteModalComponent {
  private readonly devicesService = inject(DevicesService);

  readonly device = input<Device | null>(null);
  readonly deleted = output<void>();
  readonly cancel = output<void>();

  readonly loading = signal(false);
  readonly error = signal('');

  confirmDelete(): void {
    const device = this.device();
    if (!device) return;
    this.loading.set(true);
    this.devicesService
      .deleteDevice(device.id.toString())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          toast.success('Dispositivo eliminado');
          this.deleted.emit();
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al eliminar el dispositivo';
          this.error.set(msg);
          toast.error('Error al eliminar el dispositivo', { description: msg });
        },
      });
  }

  cancelDelete(): void {
    this.cancel.emit();
  }
}
