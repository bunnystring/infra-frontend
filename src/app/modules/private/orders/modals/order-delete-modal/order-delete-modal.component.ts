import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { Order } from '../../models/Orders';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-delete-modal',
  templateUrl: './order-delete-modal.component.html',
  styleUrls: ['./order-delete-modal.component.css'],
  imports: [CommonModule],
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
