import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { GroupsService } from '../../services/groups.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { toast } from 'ngx-sonner';

/**
 * Componente de detalle de un grupo
 *
 * @since 2026-05-11
 * @author Bunnystring
 */
@Component({
  selector: 'app-groups-detail',
  templateUrl: './groups-detail.component.html',
  styleUrls: ['./groups-detail.component.css'],
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groupsService = inject(GroupsService);
  private readonly location = inject(Location);
  private readonly loadingService = inject(LoadingService);

  readonly loading = toSignal(this.loadingService.loading$, { initialValue: false });

  private readonly groupId = toSignal(
    this.route.params.pipe(map((params) => params['id'] as string)),
    { initialValue: '' },
  );

  readonly groupResource = resource({
    params: this.groupId,
    loader: async ({ params: id }) => {
      if (!id) return null;
      return firstValueFrom(this.groupsService.getGroupById(id));
    },
  });

  readonly errorMessage = computed(() => {
    const err: any = this.groupResource.error();
    return err?.error?.message || err?.message || 'Error al cargar el grupo';
  });

  readonly removingEmployeeId = signal<string | null>(null);

  async removeEmployee(groupId: string, employeeId: string): Promise<void> {
    this.removingEmployeeId.set(employeeId);
    try {
      await firstValueFrom(this.groupsService.removeEmployeesFromGroup(groupId, employeeId));
      toast.success('Empleado removido del grupo');
      this.groupResource.reload();
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Error al remover el empleado';
      toast.error('Error al remover empleado', { description: msg });
    } finally {
      this.removingEmployeeId.set(null);
    }
  }

  refreshData(): void {
    this.groupResource.reload();
  }

  goBack(): void {
    this.location.back();
  }
}
