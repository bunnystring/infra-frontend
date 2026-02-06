/**
 * Request para crear un nuevo dispositivo
 */
export interface CreateDeviceRq {
  name: string;
  brand: string;
  barcode: string;
  status: DeviceStatus;
}

/**
 * Modelo que representa un dispositivo
 */
export interface Device {
  id: number;
  name: string;
  brand: string;
  barcode: string;
  status: DeviceStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Estados posibles de un dispositivo
 */
export enum DeviceStatus {
  GOOD_CONDITION = 'GOOD_CONDITION',
  OCCUPIED = 'OCCUPIED',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  FAIR = 'FAIR',
}

/**
 * Labels para mostrar en UI
 */
export const DeviceStatusLabels: { [key in DeviceStatus]: string } = {
  [DeviceStatus.GOOD_CONDITION]: 'Buenas Condiciones',
  [DeviceStatus.OCCUPIED]: 'Ocupado',
  [DeviceStatus.NEEDS_REPAIR]: 'Necesita Reparación',
  [DeviceStatus.FAIR]: 'Regular'
};

/**
 * Colores para badges en UI
 */
export const DeviceStatusColors: { [key in DeviceStatus]: string } = {
  [DeviceStatus.GOOD_CONDITION]: 'success',
  [DeviceStatus.FAIR]: 'warning',
  [DeviceStatus.OCCUPIED]: 'info',
  [DeviceStatus.NEEDS_REPAIR]: 'danger'
};

/** Request para actualizar el estado de múltiples dispositivos
 */
export interface UpdateDevicesStateRq {
  ids: string[];
  status: DeviceStatus;
  orderId?: string;
}

/**
 * Request DTO para restaurar estados originales de devices.
 * Mapea a RestoreDevicesRq del backend.
 */
export interface RestoreDevicesRq {
  items: RestoreDeviceItem[];
}

/** Item para restaurar el estado original de un dispositivo
 */
export interface RestoreDeviceItem {
  id: string;
  originalStatus: DeviceStatus;
}
