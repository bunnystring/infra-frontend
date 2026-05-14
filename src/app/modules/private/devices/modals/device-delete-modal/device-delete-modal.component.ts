import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Output, EventEmitter, inject } from '@angular/core';
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
  private readonly cd = inject(ChangeDetectorRef);

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
      .pipe(finalize(() => { this.loading = false; this.cd.markForCheck(); }))
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
          this.cd.markForCheck();
          toast.error('Error al eliminar el dispositivo', { description: msg });
        },
      });
  }

  cancelDelete(): void {
    this.cancel.emit();
  }
}
