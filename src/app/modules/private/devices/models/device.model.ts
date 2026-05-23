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
  id: string;
  name: string;
  brand: string;
  barcode: string;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string | null;
  assignmentActive?: boolean;
  selected?: boolean;
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
  [DeviceStatus.OCCUPIED]: 'primary',
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


/**
 * Response de operaciones por lotes
 */
export interface BatchOperationResponse {
  success: Device[];
  failed: Array<{
    id: string;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

/**
 * Filtros para búsqueda y filtrado de dispositivos
 */
export interface DeviceFilters {
  search?: string;
  status?: DeviceStatus | 'ALL';
  brand?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Estadísticas calculadas de dispositivos
 */
export interface DeviceStats {
  totalDevices: number;
  goodCondition: number;
  needsRepair: number;
  occupied: number;
  fair: number;
  devicesByBrand: Array<{ brand: string; count: number }>;
  recentlyAdded?: Device[];
  recentlyUpdated?: Device[];
}

/**
 * Parámetros de paginación para listas grandes
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: keyof Device;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response paginada de dispositivos
 */
export interface PaginatedDevicesResponse {
  data: Device[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Opciones para exportar dispositivos
 */
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filters?: DeviceFilters;
  columns?: Array<keyof Device>;
  includeStats?: boolean;
}

export { DeviceUtils } from './device.utils';

// Resultado del formulario de creación/edición de dispositivo
export interface DeviceFormResult {
  device: Device;
  mode: 'create' | 'edit';
}

// Historial de asignaciones de un dispositivo
export interface DeviceAssignment {
  orderFound?: boolean;
  orderName?: string;
  deviceId: string;
  orderId: string;
  deviceName: string;
  deviceStatus: DeviceStatus;
  assignedAt: string;
  releasedAt?: string;
}

// Request para actualizar el estado de múltiples dispositivos
export interface DeviceUpdateBatchRq {
  deviceIds: string[];
  state: DeviceStatus;
}

/**
 * Request para obtener un lote de dispositivos por sus IDs
 */
export interface DevicesBatchRq {
  "ids": string[];
}

/**
 * Response de la verificación de asignación activa para múltiples dispositivos
 */
export interface DevicesBatchAssignmentRs {
  deviceId: string;
  active: boolean;
}
