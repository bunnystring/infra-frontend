import { Injectable, inject } from '@angular/core';
import {Observable} from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { CreateDeviceRq, Device, DeviceStatus, RestoreDevicesRq, UpdateDevicesStateRq } from '../models/device.model';


/**
 * Servicio para gestionar dispositivos
 *
 * @since 2026-02-05
 * @author Bunnystring
 */
@Injectable({
  providedIn: 'root'
})
export class DevicesService {

  // Injected services
  private apiService = inject(ApiService);

  /**
   * Crea un nuevo dispositivo
   * @param device Dispositivo a crear
   */
  createDevice(device: Partial<CreateDeviceRq>): Observable<Device> {
    return this.apiService.post<Device>('/devices', device);
  }

  /**
   * Obtiene un dispositivo por su código de barras
   * @param barcode Código de barras del dispositivo
   */
  getDeviceByBarcode(barcode: string): Observable<Device> {
    return this.apiService.get<Device>(`/devices/barcode/${barcode}`);
  }

  /**
   * Obtiene un dispositivo por su ID
   * @param id ID del dispositivo
   */
  getDeviceById(id: number): Observable<Device> {
    return this.apiService.get<Device>(`/devices/${id}`);
  }

  /**
   * Obtiene todos los dispositivos
   */
  getAllDevices(): Observable<Device[]> {
    return this.apiService.get<Device[]>('/devices');
  }

  /**
   * Obtiene dispositivos por su estado
   * @param status Estado del dispositivo
   */
  getDeviceByStatus(status: DeviceStatus): Observable<Device[]> {
    return this.apiService.get<Device[]>(`/devices/status/${status}`);
  }

  /**
   * Obtiene dispositivos por múltiples estados
   * @param statuses Estados de los dispositivos
   */
  getDeviceStatuses(statuses: DeviceStatus[]): Observable<Device[]> {
    // Construye los parámetros de consulta para múltiples estados
    const params = this.apiService.buildParams({statuses});
    return this.apiService.get<Device[]>('/devices/statuses', params);
  }

  /**
   * Elimina un dispositivo por su ID
   * @param id ID del dispositivo a eliminar
   */
  deleteDevice(id: string): Observable<void> {
    return this.apiService.delete<void>(`/devices/${id}`);
  }

  /**
   * Actualiza un dispositivo existente
   * @param id ID del dispositivo a actualizar
   * @param device Datos del dispositivo a actualizar
   */
  updateDevice(id: string, device: Partial<CreateDeviceRq>): Observable<Device> {
    return this.apiService.put<Device>(`/devices/${id}`, device);
  }

  /**
   * Obtiene un lote de dispositivos por sus IDs
   * @param ids Array de IDs de dispositivos
   */
  getDevicesBatch(ids: string[]): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/batch', { ids });
  }

  /**
   * Reserva múltiples dispositivos
   * @param request Datos para reservar los dispositivos
   */
  reserveDevices(request: UpdateDevicesStateRq): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/reserve', request);
  }

  /**
   * Restaura los estados originales de múltiples dispositivos
   * @param items Lista de dispositivos a restaurar
   */
  restoreDevicesStates(items: RestoreDevicesRq[]): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/restore', items);
  }

  /**
   * Actualiza el estado de múltiples dispositivos
   * @param request Datos para actualizar los dispositivos
   */
  updateDevicesByBatch(request: UpdateDevicesStateRq): Observable<Device[]> {
    return this.apiService.post<Device[]>('/devices/update-batch', request);
  }

  /**
   * Sube un archivo con múltiples dispositivos para creación masiva
   * @param formData FormData que contiene el archivo
   */
  uploadDevicesArchive(formData: FormData): Observable<Device[]> {
    return this.apiService.postFormData<Device[]>('/devices/batch/upload', formData);
  }
}
