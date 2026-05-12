import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { Order } from '../../models/Orders';

/**
 * Componente modal para confirmar la eliminación de una orden. Muestra detalles de la orden y proporciona opciones para confirmar o cancelar la eliminación. Emite eventos para que el componente padre pueda manejar la lógica de eliminación y cierre del modal.
 * @since 2026-05-11
 * @author BunnyString
 */
@Component({
  selector: 'app-order-delete-modal',
  templateUrl: './order-delete-modal.component.html',
  styleUrls: ['./order-delete-modal.component.css'],
  imports: [],
  standalone: true,
})
export class OrderDeleteModalComponent implements OnInit {
    // Inputs y Outputs
  @Input() order: Order | null = null;
  @Output() deleted = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

   // Estado de carga y error
  loading = false;
  error = '';

  constructor() { }

  ngOnInit() {
  }

  confirmDelete(): void{

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
