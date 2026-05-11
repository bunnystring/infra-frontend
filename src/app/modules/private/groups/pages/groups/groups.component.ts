import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Group, GroupFormResult } from '../../models/groups.model';
import { toast } from 'ngx-sonner';
import { GroupCreateEditModalComponent } from '../../modals/group-create-edit-modal/group-create-edit-modal.component';
import { GroupDeleteModalComponent } from '../../modals/group-delete-modal/group-delete-modal.component';
import { LoadingService } from '../../../../../core/services/loading.service';
import { GroupsService } from '../../services/groups.service';

/**
 * Componente principal del módulo de grupos
 *
 * @since 2026-05-11
 * @author Bunnystring
 */
@Component({
  selector: 'app-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroupCreateEditModalComponent, GroupDeleteModalComponent, DatePipe],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css',
})
export class GroupsComponent {
  private readonly groupsService = inject(GroupsService);
  private readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);

  readonly loading = toSignal(this.loadingService.loading$, { initialValue: false });

  readonly groupsResource = resource({
    loader: () => firstValueFrom(this.groupsService.getAllGroups()),
  });

  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly groupToEdit = signal<Group | null>(null);
  readonly groupToDelete = signal<Group | null>(null);

  readonly filteredGroups = computed(() => {
    const groups = this.groupsResource.value() ?? [];
    const search = this.search().toLowerCase();
    if (!search) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(search) ||
        g.address.toLowerCase().includes(search),
    );
  });

  readonly filteredStats = computed(() => {
    const groups = this.filteredGroups();
    return {
      total: groups.length,
      withEmployees: groups.filter((g) => g.employees?.length > 0).length,
      empty: groups.filter((g) => !g.employees?.length).length,
    };
  });

  readonly totalItems = computed(() => this.filteredGroups().length);

  readonly totalPages = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize()) || 1,
  );

  readonly pagedGroups = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredGroups().slice(start, start + this.pageSize());
  });

  constructor() {
    effect(() => {
      if (this.groupsResource.error()) {
        toast.error('Error al obtener grupos');
      }
    });
    effect(() => {
      const groups = this.groupsResource.value();
      if (groups !== undefined && groups.length === 0) {
        toast.info('No hay grupos para mostrar actualmente.');
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
    this.groupToEdit.set(null);
    this.showCreateModal.set(true);
    this.showEditModal.set(false);
  }

  openEditModal(group: Group): void {
    this.groupToEdit.set(group);
    this.showEditModal.set(true);
    this.showCreateModal.set(false);
  }

  openDeleteModal(group: Group): void {
    this.groupToDelete.set(group);
    this.showDeleteModal.set(true);
  }

  onGroupDeleted(): void {
    this.showDeleteModal.set(false);
    this.groupToDelete.set(null);
    this.groupsResource.reload();
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.groupToDelete.set(null);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.groupToEdit.set(null);
    this.groupToDelete.set(null);
  }

  handleModalSave({ mode }: GroupFormResult): void {
    toast.success(mode === 'create' ? 'Grupo creado' : 'Grupo actualizado');
    this.groupsResource.reload();
    this.closeModals();
  }

  goToDetail(group: Group): void {
    this.router.navigate(['/app/groups', group.id]);
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.page.set(pageNumber);
    }
  }

  nextPage(): void { this.goToPage(this.page() + 1); }
  previousPage(): void { this.goToPage(this.page() - 1); }

  getShortText(text: string): string {
    return text.length > 30 ? text.substring(0, 30) + '…' : text;
  }
}
