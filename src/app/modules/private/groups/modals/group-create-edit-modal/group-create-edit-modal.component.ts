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
  minLength,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Group, GroupFormResult } from '../../models/groups.model';
import { GroupsService } from '../../services/groups.service';
import { toast } from 'ngx-sonner';

/**
 * Modal para crear o editar un grupo usando Signal Forms (Angular 21)
 *
 * @since 2026-05-11
 * @author Bunnystring
 */
@Component({
  selector: 'app-group-create-edit-modal',
  templateUrl: './group-create-edit-modal.component.html',
  standalone: true,
  styleUrls: ['./group-create-edit-modal.component.css'],
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupCreateEditModalComponent {
  readonly group = input<Group | null>(null);
  readonly close = output<void>();
  readonly save = output<GroupFormResult>();

  private readonly groupsService = inject(GroupsService);

  readonly formError = signal('');
  readonly formLoading = signal(false);

  readonly model = linkedSignal(() => {
    const g = this.group();
    return {
      name: g?.name ?? '',
      address: g?.address ?? '',
    };
  });

  readonly groupForm = form(this.model, (s) => {
    required(s.name, { message: 'Nombre es obligatorio' });
    minLength(s.name, 3, { message: 'Debe tener al menos 3 caracteres' });
    required(s.address, { message: 'Dirección es obligatoria' });
    minLength(s.address, 3, { message: 'Debe tener al menos 3 caracteres' });
  });

  onSubmit(): void {
    this.formError.set('');
    const isEdit = !!this.group();

    submit(this.groupForm, async () => {
      this.formLoading.set(true);
      try {
        const { name, address } = this.model();
        const result = await firstValueFrom(
          isEdit
            ? this.groupsService.updateGroup(this.group()!.id, { name, address })
            : this.groupsService.createGroup({ name, address }),
        );
        this.save.emit({ group: result, mode: isEdit ? 'edit' : 'create' });
      } catch (err: any) {
        const msg = err?.error?.message || err?.message || 'Error al guardar el grupo';
        this.formError.set(msg);
        toast.error('Error al guardar el grupo', { description: msg });
      } finally {
        this.formLoading.set(false);
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
