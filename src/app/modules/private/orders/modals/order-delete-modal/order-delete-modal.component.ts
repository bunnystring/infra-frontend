import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Order } from '../../models/orders.model';

@Component({
  selector: 'app-order-delete-modal',
  templateUrl: './order-delete-modal.component.html',
  styleUrls: ['./order-delete-modal.component.css'],
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDeleteModalComponent {
  readonly order = input<Order | null>(null);
  readonly deleted = output<void>();
  readonly cancel = output<void>();

  readonly loading = signal(false);
  readonly error = signal('');

  cancelDelete(): void {
    this.cancel.emit();
  }
}
