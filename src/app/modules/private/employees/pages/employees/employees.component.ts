import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Employee, EmployeeFormResult, EmployeeStatus } from '../../models/employe.model';
import { toast } from 'ngx-sonner';
import { EmployeeCreateEditModalComponent } from '../../modals/employee-create-edit-modal/employee-create-edit-modal.component';
import { EmployeeDeleteModalComponent } from '../../modals/employee-delete-modal/employee-delete-modal.component';
import { LoadingService } from '../../../../../core/services/loading.service';
import { EmployeesService } from '../../services/employees.service';

/**
 * Componente principal del módulo de empleados
 *
 * @since 2026-05-10
 * @author Bunnystring
 */
@Component({
  selector: 'app-employees',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeCreateEditModalComponent, EmployeeDeleteModalComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css',
})
export class EmployeesComponent {
  private readonly employeesService = inject(EmployeesService);
  private readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);

  readonly EmployeeStatus = EmployeeStatus;

  // Estado de carga del interceptor HTTP
  readonly loading = toSignal(this.loadingService.loading$, { initialValue: false });

  // Recurso reactivo: carga empleados del servidor
  readonly employeesResource = resource({
    loader: () => firstValueFrom(this.employeesService.getAllEmployees()),
  });

  // Búsqueda y paginación
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  // Estado de modales
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly employeeToEdit = signal<Employee | null>(null);
  readonly employeeToDelete = signal<Employee | null>(null);

  // Estado derivado con computed()
  readonly filteredEmployees = computed(() => {
    const employees = this.employeesResource.value() ?? [];
    const search = this.search().toLowerCase();
    if (!search) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search),
    );
  });

  readonly filteredStats = computed(() => {
    const employees = this.filteredEmployees();
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length,
      inactive: employees.filter((e) => e.status === EmployeeStatus.INACTIVE).length,
    };
  });

  readonly totalItems = computed(() => this.filteredEmployees().length);

  readonly totalPages = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize()) || 1,
  );

  readonly pagedEmployees = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredEmployees().slice(start, start + this.pageSize());
  });

  constructor() {
    // Efectos de notificación (side effects sobre signals)
    effect(() => {
      if (this.employeesResource.error()) {
        toast.error('Error al obtener empleados');
      }
    });
    effect(() => {
      const employees = this.employeesResource.value();
      if (employees !== undefined && employees.length === 0) {
        toast.info('No hay empleados para mostrar actualmente.');
      }
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.page.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(+value);
    this.page.set(1);
  }

  openCreateModal(): void {
    this.employeeToEdit.set(null);
    this.showCreateModal.set(true);
    this.showEditModal.set(false);
  }

  openEditModal(employee: Employee): void {
    this.employeeToEdit.set(employee);
    this.showEditModal.set(true);
    this.showCreateModal.set(false);
  }

  openDeleteModal(employee: Employee): void {
    this.employeeToDelete.set(employee);
    this.showDeleteModal.set(true);
  }

  onEmployeeDeleted(): void {
    this.showDeleteModal.set(false);
    this.employeeToDelete.set(null);
    this.employeesResource.reload();
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.employeeToDelete.set(null);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.employeeToEdit.set(null);
    this.employeeToDelete.set(null);
  }

  handleModalSave({ mode }: EmployeeFormResult): void {
    toast.success(mode === 'create' ? 'Empleado creado' : 'Empleado actualizado');
    this.employeesResource.reload();
    this.closeModals();
  }

  goToDetail(employee: Employee): void {
    this.router.navigate(['/app/employees', employee.id]);
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.page.set(pageNumber);
    }
  }

  nextPage(): void { this.goToPage(this.page() + 1); }
  previousPage(): void { this.goToPage(this.page() - 1); }

  getShortText(text: string): string {
    return text.length > 35 ? text.substring(0, 35) + '…' : text;
  }
}
