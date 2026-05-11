import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  linkedSignal,
  input,
  output,
} from '@angular/core';
import {
  form,
  FormField,
  submit,
  required,
  email as emailValidator,
  minLength,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import {
  Employee,
  EmployeeStatus,
  CreateEmployeeRq,
  EmployeeFormResult,
} from '../../models/employe.model';
import { EmployeesService } from '../../services/employees.service';
import { toast } from 'ngx-sonner';

/**
 * Modal para crear o editar un empleado usando Signal Forms (Angular 21)
 *
 * @since 2026-05-10
 * @author Bunnystring
 */
@Component({
  selector: 'app-employee-create-edit-modal',
  templateUrl: './employee-create-edit-modal.component.html',
  standalone: true,
  styleUrls: ['./employee-create-edit-modal.component.css'],
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeCreateEditModalComponent {
  // Signal inputs/outputs (Angular 17+)
  readonly employee = input<Employee | null>(null);
  readonly close = output<void>();
  readonly save = output<EmployeeFormResult>();

  private readonly employeesService = inject(EmployeesService);

  readonly documentTypes = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'TI', label: 'Tarjeta de identidad' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'NIT', label: 'NIT' },
  ];

  readonly formError = signal('');
  readonly formLoading = signal(false);

  // linkedSignal: se resetea automáticamente cuando cambia el input employee
  readonly model = linkedSignal(() => {
    const emp = this.employee();
    return {
      fullName: emp?.fullName ?? '',
      email: emp?.email ?? '',
      documentType: emp?.documentType ?? '',
      documentNumber: emp?.documentNumber ?? '',
      status: (emp?.status ?? EmployeeStatus.ACTIVE) as string,
    };
  });

  readonly employeeForm = form(this.model, (s) => {
    required(s.fullName, { message: 'Nombre completo es obligatorio' });
    minLength(s.fullName, 3, { message: 'Debe tener al menos 3 caracteres' });
    required(s.email, { message: 'Email es obligatorio' });
    emailValidator(s.email, { message: 'El email no es válido' });
    required(s.documentType, { message: 'Tipo de documento es obligatorio' });
    required(s.documentNumber, { message: 'Número de documento es obligatorio' });
    required(s.status, { message: 'Estado es obligatorio' });
  });

  onSubmit(): void {
    this.formError.set('');
    const isEdit = !!this.employee();

    submit(this.employeeForm, async () => {
      this.formLoading.set(true);
      try {
        const { fullName, email, documentType, documentNumber, status } = this.model();
        const payload: CreateEmployeeRq = {
          fullName,
          email,
          documentType,
          documentNumber,
          status: status as EmployeeStatus,
        };

        const result = await firstValueFrom(
          isEdit
            ? this.employeesService.updateEmployee(this.employee()!.id, payload)
            : this.employeesService.createEmployee(payload),
        );

        this.save.emit({ employee: result, mode: isEdit ? 'edit' : 'create' });
      } catch (err: any) {
        const msg = err?.error?.message || err?.message || 'Error al guardar el empleado';
        this.formError.set(msg);
        toast.error('Error al guardar el empleado', { description: msg });
      } finally {
        this.formLoading.set(false);
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
