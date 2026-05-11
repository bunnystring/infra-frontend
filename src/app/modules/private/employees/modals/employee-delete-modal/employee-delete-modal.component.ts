import { Component, ChangeDetectionStrategy, inject, signal, input, output } from '@angular/core';
import { Employee } from '../../models/employe.model';
import { EmployeesService } from '../../services/employees.service';
import { toast } from 'ngx-sonner';
import { finalize } from 'rxjs';

/**
 * Modal de confirmación para eliminar un empleado
 *
 * @since 2026-05-10
 * @author Bunnystring
 */
@Component({
  selector: 'app-employee-delete-modal',
  templateUrl: './employee-delete-modal.component.html',
  styleUrls: ['./employee-delete-modal.component.css'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDeleteModalComponent {
  readonly employee = input<Employee | null>(null);
  readonly deleted = output<void>();
  readonly cancel = output<void>();

  private readonly employeesService = inject(EmployeesService);

  readonly loading = signal(false);
  readonly error = signal('');

  confirmDelete(): void {
    const emp = this.employee();
    if (!emp) return;

    this.loading.set(true);
    this.error.set('');

    this.employeesService
      .deleteEmployee(emp.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          toast.success('Empleado eliminado');
          this.deleted.emit();
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al eliminar el empleado';
          this.error.set(msg);
          toast.error('Error al eliminar el empleado', { description: msg });
        },
      });
  }

  cancelDelete(): void {
    this.cancel.emit();
  }
}
