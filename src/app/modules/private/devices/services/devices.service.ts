import { Injectable, inject } from '@angular/core';
import {Observable, finalize} from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { CreateDeviceRq, Device, DeviceAssignment, DevicesBatchAssignmentRs, DevicesBatchRq, DeviceStatus, DeviceUpdateBatchRq, RestoreDevicesRq, UpdateDevicesStateRq } from '../models/device.model';


@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  // Injected services
  private apiService = inject(ApiService);

  createDevice(device: Partial<CreateDeviceRq>): Observable<Device> {
    return this.apiService.post<Device>('/devices', device);
  }

  getDeviceByBarcode(barcode: string): Observable<Device> {
    return this.apiService.get<Device>(`/devices/barcode/${barcode}`);
  }

  getDeviceById(id: string): Observable<Device> {
    return this.apiService.get<Device>(`/devices/${id}`);
  }

  getAllDevices(): Observable<Device[]> {
    return this.apiService.get<Device[]>('/devices');
  }

  getDeviceByStatus(status: DeviceStatus): Observable<Device[]> {
    return this.apiService.get<Device[]>(`/devices/status/${status}`);
  }

  getDeviceStatuses(statuses: DeviceStatus[]): Observable<Device[]> {
    // Construye los parámetros de consulta para múltiples estados
    const params = this.apiService.buildParams({statuses});
    return this.apiService.get<Device[]>('/devices/statuses', params);
  }

  deleteDevice(id: string): Observable<void> {
    return this.apiService.delete<void>(`/devices/${id}`);
  }

  updateDevice(id: string, device: Partial<CreateDeviceRq>): Observable<Device> {
    return this.apiService.put<Device>(`/devices/${id}`, device);
  }

  getDevicesBatch(ids: DevicesBatchRq): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/batch', ids);
  }

  reserveDevices(request: UpdateDevicesStateRq): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/reserve', request);
  }

  restoreDevicesStates(items: RestoreDevicesRq[]): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/restore', items);
  }

  updateDevicesByBatch(request: UpdateDevicesStateRq): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/update-batch', request);
  }

  uploadDevicesArchive(formData: FormData): Observable<Device[]> {
    return this.apiService.postFormData<Device[]>('/devices/batch/upload', formData);
  }

  getDeviceAssignmentHistory(deviceId: string): Observable<DeviceAssignment[]> {
    return this.apiService.get<DeviceAssignment[]>(`/devices-assignments/${deviceId}/history`);
  }

  uploadBulkDevices(file: File): Observable<Device[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postFormData<Device[]>('/devices/batch/upload', formData);
  }

  hasActiveAssignmentBatch(devices: DevicesBatchRq): Observable<DevicesBatchAssignmentRs[]> {
    return this.apiService.post<DevicesBatchAssignmentRs[]>(`/devices-assignments/devices/active`, devices);
  }

  updateBatchDevicesState(request: DeviceUpdateBatchRq): Observable<void> {
    return this.apiService.put<void>('/devices/update-batch', request);
  }
}
