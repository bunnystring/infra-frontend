import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import {
  Device,
  DeviceStatus,
  DeviceStatusLabels,
  DeviceStatusColors,
  DeviceFormResult,
  DeviceUpdateBatchRq,
} from '../../models/device.model';
import { toast } from 'ngx-sonner';
import { DeviceCreateEditModalComponent } from '../../modals/device-create-edit-modal/device-create-edit-modal.component';
import { LoadingService } from '../../../../../core/services/loading.service';
import { DevicesService } from '../../services/devices.service';
import { DeviceDeleteModalComponent } from '../../modals/device-delete-modal/device-delete-modal.component';
import { DeviceBulkUploadModalComponent } from '../../modals/device-bulk-upload-modal/device-bulk-upload-modal.component';
import { DevicesStore } from '../../store/devices.store';

@Component({
  selector: 'app-devices',
  imports: [
    AsyncPipe,
    DecimalPipe,
    FormsModule,
    DeviceCreateEditModalComponent,
    DeviceDeleteModalComponent,
    DeviceBulkUploadModalComponent,
  ],
  standalone: true,
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit {
  private readonly store = inject(DevicesStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly devicesService = inject(DevicesService);

  readonly loading$ = inject(LoadingService).loading$;

  // Template enums
  readonly DeviceStatus = DeviceStatus;
  readonly DeviceStatusLabels = DeviceStatusLabels;
  readonly DeviceStatusColors = DeviceStatusColors;

  // Modal state (ephemeral UI)
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showBulkUploadModal = false;
  deviceToEdit: Device | null = null;
  deviceToDelete: Device | null = null;
  formMode: 'create' | 'edit' = 'create';

  // Bulk update state
  bulkMode = false;
  bulkStatus: DeviceStatus | null = null;

  // Filter & pagination state as signals
  private readonly _search = signal('');
  private readonly _statusFilter = signal<DeviceStatus | 'ALL'>('ALL');
  private readonly _page = signal(1);
  private readonly _pageSize = signal(10);
  private readonly _selectedIds = signal<Set<string>>(new Set());

  get search() { return this._search(); }
  set search(v: string) { this._search.set(v); this._page.set(1); }

  get statusFilter() { return this._statusFilter(); }
  set statusFilter(v: DeviceStatus | 'ALL') { this._statusFilter.set(v); this._page.set(1); }

  get page() { return this._page(); }
  set page(v: number) { this._page.set(v); }

  get pageSize() { return this._pageSize(); }
  set pageSize(v: number) { this._pageSize.set(v); this._page.set(1); }

  // Derived state as computed (memoized)
  readonly filteredDevices = computed(() => {
    const s = this._search().toLowerCase();
    const f = this._statusFilter();
    return this.store.devices().filter(
      (d) => this.matchSearch(d, s) && (f === 'ALL' || d.status === f),
    );
  });

  readonly filteredStats = computed(() => {
    const list = this.filteredDevices();
    return {
      totalDevices: list.length,
      goodCondition: list.filter((d) => d.status === DeviceStatus.GOOD_CONDITION).length,
      occupied: list.filter((d) => d.status === DeviceStatus.OCCUPIED).length,
      needsRepair: list.filter((d) => d.status === DeviceStatus.NEEDS_REPAIR).length,
      fair: list.filter((d) => d.status === DeviceStatus.FAIR).length,
    };
  });

  readonly pagedDevices = computed(() => {
    const p = this._page();
    const ps = this._pageSize();
    return this.filteredDevices().slice((p - 1) * ps, p * ps);
  });

  // Error/availability derived from store
  get deviceError() { return !!this.store.error(); }
  get buttonsIsAvailable() { return !this.store.error(); }
  get isRetrying() { return this.store.isLoading(); }

  get totalItems() { return this.filteredDevices().length; }

  get pages(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  ngOnInit() {
    if (this.store.error()) {
      toast.error('No se pudo conectar al microservicio de dispositivos.');
    } else if (this.store.devices().length === 0) {
      toast.info('No hay dispositivos para mostrar actualmente.');
    }
  }

  loadDevices(): void {
    this.store.loadDevices().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  retryLoadData(): void {
    this.loadDevices();
  }

  onSearchChange(value: string): void {
    this.search = value || '';
  }

  filterByStatus(status: DeviceStatus | 'ALL'): void {
    this.statusFilter = status;
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'ALL';
  }

  isSelected(deviceId: string): boolean {
    return this._selectedIds().has(deviceId);
  }

  toggleSelectDevice(deviceId: string): void {
    const next = new Set(this._selectedIds());
    if (next.has(deviceId)) next.delete(deviceId);
    else next.add(deviceId);
    this._selectedIds.set(next);
  }

  toggleSelectAllFiltered(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this._selectedIds());
    this.filteredDevices().forEach((device) => {
      if (!device.assignmentActive) {
        if (checked) next.add(device.id);
        else next.delete(device.id);
      }
    });
    this._selectedIds.set(next);
  }

  allSelectedFiltered(): boolean {
    const selectable = this.filteredDevices().filter((d) => d.assignmentActive);
    const ids = this._selectedIds();
    return selectable.length > 0 && selectable.every((d) => ids.has(d.id));
  }

  countSelectedDevices(): number {
    return this._selectedIds().size;
  }

  updateDevicesStatus(): void {
    const selectedIds = [...this._selectedIds()];
    if (!this.bulkStatus || selectedIds.length === 0) return;

    const request: DeviceUpdateBatchRq = {
      deviceIds: selectedIds,
      state: this.bulkStatus,
    };

    this.devicesService
      .updateBatchDevicesState(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          toast.error('Error al actualizar estados', { description: err.message });
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          toast.success('Estados actualizados correctamente');
          this.bulkStatus = null;
          this.bulkMode = false;
          this._selectedIds.set(new Set());
          this.loadDevices();
        }
      });
  }

  activateBulkMode(): void {
    this.bulkMode = true;
  }

  cancelBulkMode(): void {
    this.bulkMode = false;
    this.bulkStatus = null;
    this._selectedIds.set(new Set());
  }

  openCreateModal(): void {
    this.formMode = 'create';
    this.deviceToEdit = null;
    this.showCreateModal = true;
    this.showEditModal = false;
  }

  openEditModal(device: Device): void {
    this.formMode = 'edit';
    this.deviceToEdit = device;
    this.showEditModal = true;
    this.showCreateModal = false;
  }

  openDeleteModal(device: Device): void {
    this.deviceToDelete = device;
    this.showDeleteModal = true;
  }

  onDeviceDeleted(): void {
    this.showDeleteModal = false;
    this.deviceToDelete = null;
    this.loadDevices();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deviceToDelete = null;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.deviceToEdit = null;
    this.deviceToDelete = null;
  }

  handleModalSave({ mode }: DeviceFormResult): void {
    toast.success(mode === 'create' ? 'Dispositivo creado' : 'Dispositivo actualizado');
    this.loadDevices();
    this.closeModals();
  }

  clearError(): void {
    this.store.clearError();
  }

  getStatusBadge(status: DeviceStatus): string {
    return `badge ${DeviceStatusColors[status]} capitalize`;
  }

  goToDetail(device: Device): void {
    this.router.navigate(['/app/devices', device.id]);
  }

  openBulkUploadModal(): void {
    this.showBulkUploadModal = true;
  }

  closeBulkUploadModal(): void {
    this.showBulkUploadModal = false;
  }

  onBulkUploadSuccess(uploadedDevices: Device[]): void {
    toast.success(`${uploadedDevices.length} dispositivos cargados exitosamente`);
    this.loadDevices();
    this.closeBulkUploadModal();
  }

  refreshData(): void {
    this.loadDevices();
  }

  getTextoShort(texto: string): string {
    return texto.substring(0, 15);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this._pageSize()) || 1;
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.getTotalPages()) {
      this._page.set(pageNumber);
    }
  }

  nextPage(): void { this.goToPage(this.page + 1); }
  previousPage(): void { this.goToPage(this.page - 1); }

  private matchSearch(device: Device, search: string): boolean {
    if (!search) return true;
    return (
      device.name.toLowerCase().includes(search) ||
      device.brand.toLowerCase().includes(search) ||
      device.barcode.toLowerCase().includes(search)
    );
  }
}
