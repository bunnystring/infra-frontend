import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Device } from '../../models/device.model';
import { DevicesService } from '../../services/devices.service';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
import { finalize } from 'rxjs';
import {} from 'rxjs';

@Component({
  selector: 'app-device-delete-modal',
  templateUrl: './device-delete-modal.component.html',
  styleUrls: ['./device-delete-modal.component.css'],
  imports: [CommonModule],
})
export class DeviceDeleteModalComponent implements OnInit {

  // Inputs y Outputs
  @Input() device: Device | null = null;
  @Output() deleted = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // Estado de carga y error
  loading = false;
  error = '';

  constructor(private devicesService: DevicesService) {}

  /**
   * Inicializa el componente
   */
  ngOnInit() {}

  /**
   * Confirma la eliminación del dispositivo
   * Llama al servicio para eliminar el dispositivo por su ID
   * Muestra un toast de éxito o error según corresponda
   * @returns
   */
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
          toast.error('Error al eliminar el dispositivo', {
            description: msg,
          });
        },
      });
  }

  /**
   * Cancela la eliminación y cierra el modal
   * Emite un evento de cancelación para que el componente padre pueda manejarlo
   * @returns void
   */
  cancelDelete(): void {
    this.cancel.emit();
  }
}
