import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Employee, EmployeeFormResult, EmployeeStatus } from '../../models/employee.model';
import { toast } from 'ngx-sonner';
import { EmployeeCreateEditModalComponent } from '../../modals/employee-create-edit-modal/employee-create-edit-modal.component';
import { EmployeeDeleteModalComponent } from '../../modals/employee-delete-modal/employee-delete-modal.component';
import { LoadingService } from '../../../../../core/services/loading.service';
import { EmployeesStore } from '../../store/employees.store';

@Component({
  selector: 'app-employees',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeCreateEditModalComponent, EmployeeDeleteModalComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css',
})
export class EmployeesComponent implements OnInit {
  protected readonly store = inject(EmployeesStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly EmployeeStatus = EmployeeStatus;

  readonly loading = toSignal(inject(LoadingService).loading$, { initialValue: false });

  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly employeeToEdit = signal<Employee | null>(null);
  readonly employeeToDelete = signal<Employee | null>(null);

  readonly filteredEmployees = computed(() => {
    const s = this.search().toLowerCase();
    const employees = this.store.employees();
    if (!s) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s),
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

  get employeeError() { return !!this.store.error(); }

  ngOnInit(): void {
    if (this.store.error()) {
      toast.error('No se pudo conectar al microservicio de empleados.');
    } else if (this.store.employees().length === 0) {
      toast.info('No hay empleados para mostrar actualmente.');
    }
  }

  loadEmployees(): void {
    this.store.loadEmployees().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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
    this.loadEmployees();
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
    this.loadEmployees();
    this.closeModals();
  }

  clearError(): void {
    this.store.clearError();
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
