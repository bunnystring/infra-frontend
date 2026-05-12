import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Device } from '../../models/device.model';
import { DevicesService } from '../../services/devices.service';
import { toast } from 'ngx-sonner';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-device-delete-modal',
  templateUrl: './device-delete-modal.component.html',
  styleUrls: ['./device-delete-modal.component.css'],
  imports: [],
})
export class DeviceDeleteModalComponent {
  private readonly devicesService = inject(DevicesService);

  @Input() device: Device | null = null;
  @Output() deleted = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  loading = false;
  error = '';

  confirmDelete(): void {
    if (!this.device) return;
    this.loading = true;
    this.devicesService
      .deleteDevice(this.device.id.toString())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          toast.success('Dispositivo eliminado');
          this.deleted.emit();
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al eliminar el dispositivo';
          this.error = msg;
          toast.error('Error al eliminar el dispositivo', { description: msg });
        },
      });
  }

  cancelDelete(): void {
    this.cancel.emit();
  }
}
