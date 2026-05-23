import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { EmployeeStatus } from '../../models/employee.model';
import { EmployeesService } from '../../services/employees.service';
import { LoadingService } from '../../../../../core/services/loading.service';

/**
 * Componente de detalle de un empleado
 *
 * @since 2026-05-10
 * @author Bunnystring
 */
@Component({
  selector: 'app-employees-detail',
  templateUrl: './employees-detail.component.html',
  styleUrls: ['./employees-detail.component.css'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeesService = inject(EmployeesService);
  private readonly location = inject(Location);
  private readonly loadingService = inject(LoadingService);

  readonly EmployeeStatus = EmployeeStatus;

  // Loading del interceptor HTTP
  readonly loading = toSignal(this.loadingService.loading$, { initialValue: false });

  // ID reactivo desde los parámetros de ruta
  private readonly employeeId = toSignal(
    this.route.params.pipe(map((params) => params['id'] as string)),
    { initialValue: '' },
  );

  // Recurso reactivo: recarga automáticamente cuando cambia el ID en la URL
  readonly employeeResource = resource({
    params: this.employeeId,
    loader: async ({ params: id }) => {
      if (!id) return null;
      return firstValueFrom(this.employeesService.getEmployeeById(id));
    },
  });

  readonly errorMessage = computed(() => {
    const err: any = this.employeeResource.error();
    return err?.error?.message || err?.message || 'Error al cargar el empleado';
  });

  refreshData(): void {
    this.employeeResource.reload();
  }

  goBack(): void {
    this.location.back();
  }
}
