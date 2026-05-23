import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Observable, catchError, concatMap, map, of, tap } from 'rxjs';
import { Device, DevicesBatchRq, DeviceStatus } from '../models/device.model';
import { DevicesService } from '../services/devices.service';

interface DevicesState {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
}

export const DevicesStore = signalStore(
  { providedIn: 'root' },
  withState<DevicesState>({
    devices: [],
    isLoading: false,
    error: null,
  }),
  withComputed(({ devices }) => ({
    stats: computed(() => {
      const list = devices();
      return {
        totalDevices: list.length,
        goodCondition: list.filter((d) => d.status === DeviceStatus.GOOD_CONDITION).length,
        occupied: list.filter((d) => d.status === DeviceStatus.OCCUPIED).length,
        needsRepair: list.filter((d) => d.status === DeviceStatus.NEEDS_REPAIR).length,
        fair: list.filter((d) => d.status === DeviceStatus.FAIR).length,
      };
    }),
  })),
  withMethods((store) => {
    const devicesService = inject(DevicesService);

    return {
      loadDevices(): Observable<Device[]> {
        patchState(store, { isLoading: true, error: null });
        return devicesService.getAllDevices().pipe(
          concatMap((devices) => {
            if (!devices || devices.length === 0) return of([]);
            const rq: DevicesBatchRq = { ids: devices.map((d) => d.id) };
            return devicesService.hasActiveAssignmentBatch(rq).pipe(
              map((assignments) =>
                devices.map((device): Device => {
                  const found = assignments.find((a) => a.deviceId === device.id);
                  return {
                    ...device,
                    assignmentActive: found ? found.active : false,
                    selected: false,
                  };
                }),
              ),
            );
          }),
          tap((devices) => patchState(store, { devices, isLoading: false })),
          catchError((err) => {
            patchState(store, { error: 'Error al cargar dispositivos', isLoading: false });
            return of([]);
          }),
        );
      },

      upsertDevice(device: Device): void {
        patchState(store, (state) => ({
          devices: state.devices.some((d) => d.id === device.id)
            ? state.devices.map((d) => (d.id === device.id ? device : d))
            : [...state.devices, device],
        }));
      },

      removeDevice(id: string): void {
        patchState(store, (state) => ({
          devices: state.devices.filter((d) => d.id !== id),
        }));
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
