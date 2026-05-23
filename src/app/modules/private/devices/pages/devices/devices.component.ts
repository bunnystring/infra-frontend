import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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

  readonly isLoading = toSignal(inject(LoadingService).loading$, { initialValue: false });

  // Template enums
  readonly DeviceStatus = DeviceStatus;
  readonly DeviceStatusLabels = DeviceStatusLabels;
  readonly DeviceStatusColors = DeviceStatusColors;

  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly showBulkUploadModal = signal(false);
  readonly deviceToEdit = signal<Device | null>(null);
  readonly deviceToDelete = signal<Device | null>(null);
  readonly formMode = signal<'create' | 'edit'>('create');

  readonly bulkMode = signal(false);
  readonly bulkStatus = signal<DeviceStatus | null>(null);

  // Filter & pagination state
  readonly search = signal('');
  readonly statusFilter = signal<DeviceStatus | 'ALL'>('ALL');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  private readonly _selectedIds = signal<Set<string>>(new Set());

  // Derived state (memoized)
  readonly filteredDevices = computed(() => {
    const s = this.search().toLowerCase();
    const f = this.statusFilter();
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

  readonly totalItems = computed(() => this.filteredDevices().length);
  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  readonly pagedDevices = computed(() => {
    const p = this.page();
    const ps = this.pageSize();
    return this.filteredDevices().slice((p - 1) * ps, p * ps);
  });

  // Error/availability derived from store
  get deviceError() { return !!this.store.error(); }
  get buttonsIsAvailable() { return !this.store.error(); }
  get isRetrying() { return this.store.isLoading(); }

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
    this.search.set(value || '');
    this.page.set(1);
  }

  filterByStatus(status: DeviceStatus | 'ALL'): void {
    this.statusFilter.set(status);
    this.page.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(+value);
    this.page.set(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
    this.page.set(1);
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
    if (!this.bulkStatus() || selectedIds.length === 0) return;

    const request: DeviceUpdateBatchRq = {
      deviceIds: selectedIds,
      state: this.bulkStatus()!,
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
          this.bulkStatus.set(null);
          this.bulkMode.set(false);
          this._selectedIds.set(new Set());
          this.loadDevices();
        }
      });
  }

  activateBulkMode(): void {
    this.bulkMode.set(true);
  }

  cancelBulkMode(): void {
    this.bulkMode.set(false);
    this.bulkStatus.set(null);
    this._selectedIds.set(new Set());
  }

  openCreateModal(): void {
    this.formMode.set('create');
    this.deviceToEdit.set(null);
    this.showCreateModal.set(true);
    this.showEditModal.set(false);
  }

  openEditModal(device: Device): void {
    this.formMode.set('edit');
    this.deviceToEdit.set(device);
    this.showEditModal.set(true);
    this.showCreateModal.set(false);
  }

  openDeleteModal(device: Device): void {
    this.deviceToDelete.set(device);
    this.showDeleteModal.set(true);
  }

  onDeviceDeleted(): void {
    this.showDeleteModal.set(false);
    this.deviceToDelete.set(null);
    this.loadDevices();
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.deviceToDelete.set(null);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.deviceToEdit.set(null);
    this.deviceToDelete.set(null);
  }

  handleModalSave({ mode }: DeviceFormResult): void {
    toast.success(mode === 'create' ? 'Dispositivo creado' : 'Dispositivo actualizado');
    this.loadDevices();
    this.closeModals();
  }

  clearError(): void {
    this.store.clearError();
  }

  goToDetail(device: Device): void {
    this.router.navigate(['/app/devices', device.id]);
  }

  openBulkUploadModal(): void {
    this.showBulkUploadModal.set(true);
  }

  closeBulkUploadModal(): void {
    this.showBulkUploadModal.set(false);
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

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.page.set(pageNumber);
    }
  }

  nextPage(): void { this.goToPage(this.page() + 1); }
  previousPage(): void { this.goToPage(this.page() - 1); }

  private matchSearch(device: Device, search: string): boolean {
    if (!search) return true;
    return (
      device.name.toLowerCase().includes(search) ||
      device.brand.toLowerCase().includes(search) ||
      device.barcode.toLowerCase().includes(search)
    );
  }
}
