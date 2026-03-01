import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Device, DevicesBatchRq } from '../models/device.model';
import { DevicesService } from '../services/devices.service';
import { Observable, of, map, catchError, concatMap } from 'rxjs';

/**
 * Resolver para cargar la lista de dispositivos con su estado de asignación activa antes de mostrar la página de dispositivos.
 *
 * @since 2026-02-05
 * @author Bunnystring
 */
@Injectable({ providedIn: 'root' })
export class DevicesResolver implements Resolve<Device[] | 'ERROR'> {
  constructor(private devicesService: DevicesService) {}

  /**
   * Resuelve la lista de dispositivos con su estado de asignación activa.
   * @returns Observable<Device[] | 'ERROR'>
   */
  resolve(): Observable<Device[] | 'ERROR'> {
    return this.devicesService.getAllDevices().pipe(
      concatMap((devices) => {
        if (!devices || devices.length === 0) {
          return of([]);
        }
        const rq: DevicesBatchRq = {
          ids: devices.map((device) => device.id),
        };
        return this.devicesService.hasActiveAssignmentBatch(rq).pipe(
          map((assignments) =>
            devices.map((device): Device => {
              const found = assignments.find((a) => a.deviceId === device.id);
              return {
                ...device,
                assignmentActive: found ? found.active : false,
                selected: false,
              } as Device;
            }),
          ),
        );
      }),
      catchError(() => of('ERROR' as const)),
    );
  }
}
