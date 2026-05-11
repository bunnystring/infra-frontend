import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Subject,
  takeUntil,
  BehaviorSubject,
  Observable,
  combineLatest,
  startWith,
  map,
  tap,
  catchError,
  of,
} from 'rxjs';
import { Group, GroupFormResult } from '../../models/groups.model';
import { toast } from 'ngx-sonner';
import { GroupCreateEditModalComponent } from '../../modals/group-create-edit-modal/group-create-edit-modal.component';
import { GroupDeleteModalComponent } from '../../modals/group-delete-modal/group-delete-modal.component';
import { LoadingService } from '../../../../../core/services/loading.service';
import { GroupsService } from '../../services/groups.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GroupCreateEditModalComponent,
    GroupDeleteModalComponent,
  ],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css',
})
export class GroupsComponent implements OnInit, OnDestroy {
  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  // Grupo seleccionado
  groupToEdit: Group | null = null;
  groupToDelete: Group | null = null;

  // Estado de error
  groupError = false;
  groupErrorMessage = '';
  isRetrying = false;

  // Filtro de búsqueda reactivo
  search$ = new BehaviorSubject<string>('');

  get search(): string { return this.search$.value; }
  set search(val: string) { this.search$.next(val); }

  get loading$() { return this.loadingService.loading$; }

  // Fuente de datos principal
  groups$ = new BehaviorSubject<Group[]>([]);
  filteredGroups: Group[] = [];

  // Paginación
  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  // Observable de grupos filtrados por búsqueda
  filteredGroups$: Observable<Group[]> = combineLatest([
    this.groups$,
    this.search$.pipe(startWith('')),
  ]).pipe(
    map(([groups, search]) =>
      groups.filter((g) => this.matchSearch(g, search)),
    ),
    tap((groups) => {
      this.totalItems = groups.length;
      this.filteredGroups = groups;
    }),
  );

  // Stats calculadas sobre la lista filtrada
  filteredStats$: Observable<{ total: number; withEmployees: number; empty: number }> =
    this.filteredGroups$.pipe(
      map((groups) => ({
        total: groups.length,
        withEmployees: groups.filter((g) => g.employees?.length > 0).length,
        empty: groups.filter((g) => !g.employees?.length).length,
      })),
    );

  get pagedGroups$(): Observable<Group[]> {
    return this.filteredGroups$.pipe(
      map((groups) =>
        groups.slice((this.page - 1) * this.pageSize, this.page * this.pageSize),
      ),
    );
  }

  constructor(
    private groupsService: GroupsService,
    private loadingService: LoadingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroups(): void {
    this.groupError = false;
    this.groupErrorMessage = '';

    this.groupsService
      .getAllGroups()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          toast.error('Error al obtener grupos', { description: err?.message || '' });
          this.groupError = true;
          this.groupErrorMessage = err?.message || 'Error al cargar grupos';
          this.groups$.next([]);
          this.isRetrying = false;
          return of([]);
        }),
      )
      .subscribe({
        next: (groups) => {
          if (!groups || groups.length === 0) {
            toast.info('No hay grupos para mostrar actualmente.');
          }
          this.groups$.next(groups);
          this.isRetrying = false;
        },
      });
  }

  retryLoadData(): void {
    this.isRetrying = true;
    this.loadGroups();
  }

  onSearchChange(value: string): void {
    this.page = 1;
    this.search = value || '';
  }

  resetFilters(): void {
    this.page = 1;
    this.search = '';
  }

  private matchSearch(group: Group, search: string): boolean {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      group.name.toLowerCase().includes(lower) ||
      group.address.toLowerCase().includes(lower)
    );
  }

  openCreateModal(): void {
    this.groupToEdit = null;
    this.showCreateModal = true;
    this.showEditModal = false;
  }

  openEditModal(group: Group): void {
    this.groupToEdit = group;
    this.showEditModal = true;
    this.showCreateModal = false;
  }

  openDeleteModal(group: Group): void {
    this.groupToDelete = group;
    this.showDeleteModal = true;
  }

  onGroupDeleted(): void {
    this.showDeleteModal = false;
    this.groupToDelete = null;
    this.loadGroups();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.groupToDelete = null;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.groupToEdit = null;
    this.groupToDelete = null;
  }

  handleModalSave({ mode }: GroupFormResult): void {
    toast.success(mode === 'create' ? 'Grupo creado' : 'Grupo actualizado');
    this.loadGroups();
    this.closeModals();
  }

  goToDetail(group: Group): void {
    this.router.navigate(['/app/groups', group.id]);
  }

  refreshData(): void {
    this.loadGroups();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get pages(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  goToPage(pageNumber: number): void {
    const total = this.getTotalPages();
    if (pageNumber >= 1 && pageNumber <= total) {
      this.page = pageNumber;
    }
  }

  nextPage(): void { this.goToPage(this.page + 1); }
  previousPage(): void { this.goToPage(this.page - 1); }

  getShortText(text: string): string {
    return text.length > 30 ? text.substring(0, 30) + '…' : text;
  }
}
