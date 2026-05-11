import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  output,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Group } from '../../models/groups.model';
import { GroupsService } from '../../services/groups.service';
import { toast } from 'ngx-sonner';

/**
 * Modal de confirmación para eliminar un grupo (Angular 21)
 *
 * @since 2026-05-11
 * @author Bunnystring
 */
@Component({
  selector: 'app-group-delete-modal',
  templateUrl: './group-delete-modal.component.html',
  styleUrls: ['./group-delete-modal.component.css'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDeleteModalComponent {
  readonly group = input<Group | null>(null);
  readonly deleted = output<void>();
  readonly cancel = output<void>();

  private readonly groupsService = inject(GroupsService);

  readonly loading = signal(false);
  readonly error = signal('');

  async confirmDelete(): Promise<void> {
    const g = this.group();
    if (!g) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.groupsService.deleteGroupById(g.id));
      toast.success('Grupo eliminado');
      this.deleted.emit();
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Error al eliminar el grupo';
      this.error.set(msg);
      toast.error('Error al eliminar el grupo', { description: msg });
    } finally {
      this.loading.set(false);
    }
  }

  cancelDelete(): void {
    this.cancel.emit();
  }
}
