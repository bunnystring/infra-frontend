export interface CreateDeviceRq {
  name: string;
  brand: string;
  barcode: string;
  status: DeviceStatus;
}

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

export enum DeviceStatus {
  GOOD_CONDITION = 'GOOD_CONDITION',
  OCCUPIED = 'OCCUPIED',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  FAIR = 'FAIR',
}

export const DeviceStatusLabels: { [key in DeviceStatus]: string } = {
  [DeviceStatus.GOOD_CONDITION]: 'Buenas Condiciones',
  [DeviceStatus.OCCUPIED]: 'Ocupado',
  [DeviceStatus.NEEDS_REPAIR]: 'Necesita Reparación',
  [DeviceStatus.FAIR]: 'Regular'
};

export const DeviceStatusColors: { [key in DeviceStatus]: string } = {
  [DeviceStatus.GOOD_CONDITION]: 'success',
  [DeviceStatus.FAIR]: 'warning',
  [DeviceStatus.OCCUPIED]: 'primary',
  [DeviceStatus.NEEDS_REPAIR]: 'danger'
};

export interface UpdateDevicesStateRq {
  ids: string[];
  status: DeviceStatus;
  orderId?: string;
}

export interface RestoreDevicesRq {
  items: RestoreDeviceItem[];
}

export interface RestoreDeviceItem {
  id: string;
  originalStatus: DeviceStatus;
}


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

export interface DeviceFilters {
  search?: string;
  status?: DeviceStatus | 'ALL';
  brand?: string;
  dateFrom?: string;
  dateTo?: string;
}

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

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: keyof Device;
  sortOrder?: 'asc' | 'desc';
}

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

export interface DevicesBatchRq {
  "ids": string[];
}

export interface DevicesBatchAssignmentRs {
  deviceId: string;
  active: boolean;
}
