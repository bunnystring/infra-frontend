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

/**
 * Utilidades para trabajar con dispositivos
 */
export class DeviceUtils {
  /**
   * Obtiene el label amigable de un estado
   */
  static getStatusLabel(status: DeviceStatus): string {
    return DeviceStatusLabels[status] || status;
  }

  /**
   * Obtiene la clase CSS del badge según el estado
   */
  static getStatusColor(status: DeviceStatus): string {
    return DeviceStatusColors[status] || 'badge-neutral';
  }

  /**
   * Verifica si un dispositivo está disponible para asignar
   */
  static isAvailable(device: Device): boolean {
    return (
      device.status === DeviceStatus.GOOD_CONDITION ||
      device.status === DeviceStatus.FAIR
    );
  }

  /**
   * Verifica si un dispositivo necesita atención
   */
  static needsAttention(device: Device): boolean {
    return device.status === DeviceStatus.NEEDS_REPAIR;
  }

  /**
   * Verifica si un dispositivo está en uso
   */
  static isInUse(device: Device): boolean {
    return device.status === DeviceStatus.OCCUPIED;
  }

  /**
   * Formatea la fecha de creación de forma amigable
   */
  static formatCreatedAt(device: Device): string {
    const date = new Date(device.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }

  /**
   * Valida el formato del código de barras
   */
  static isValidBarcode(barcode: string): boolean {
    // Ajusta según tu formato de barcode
    return /^[A-Z0-9]{8,}$/i.test(barcode);
  }

  /**
   * Genera un nombre descriptivo del dispositivo
   */
  static getDisplayName(device: Device): string {
    return `${device.brand} ${device.name}`;
  }

  /**
   * Ordena dispositivos por criterio
   */
  static sortDevices(
    devices: Device[],
    sortBy: keyof Device,
    order: 'asc' | 'desc' = 'asc'
  ): Device[] {
    return [...devices].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === bVal) return 0;

      if (aVal == null && bVal != null) return order === 'asc' ? -1 : 1;
      if (aVal != null && bVal == null) return order === 'asc' ? 1 : -1;
      if (aVal == null && bVal == null) return 0;

      let comparison = 0;
      if (aVal != null && bVal != null) {
        comparison = aVal > bVal ? 1 : -1;
      }
      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Agrupa dispositivos por estado
   */
  static groupByStatus(devices: Device[]): Record<DeviceStatus, Device[]> {
    return devices.reduce(
      (acc, device) => {
        if (!acc[device.status]) {
          acc[device.status] = [];
        }
        acc[device.status].push(device);
        return acc;
      },
      {} as Record<DeviceStatus, Device[]>
    );
  }

  /**
   * Agrupa dispositivos por marca
   */
  static groupByBrand(devices: Device[]): Record<string, Device[]> {
    return devices.reduce(
      (acc, device) => {
        if (!acc[device.brand]) {
          acc[device.brand] = [];
        }
        acc[device.brand].push(device);
        return acc;
      },
      {} as Record<string, Device[]>
    );
  }

  /**
   * Filtra dispositivos por texto de búsqueda
   */
  static filterBySearch(devices: Device[], search: string): Device[] {
    if (!search.trim()) return devices;

    const searchLower = search.toLowerCase();
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(searchLower) ||
        d.brand.toLowerCase().includes(searchLower) ||
        d.barcode.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Calcula estadísticas de una lista de dispositivos
   */
  static calculateStats(devices: Device[]): DeviceStats {
    const stats: DeviceStats = {
      totalDevices: devices.length,
      goodCondition: 0,
      needsRepair: 0,
      occupied: 0,
      fair: 0,
      devicesByBrand: [],
    };

    const brandMap = new Map<string, number>();

    devices.forEach((device) => {
      // Contar por estado
      switch (device.status) {
        case DeviceStatus.GOOD_CONDITION:
          stats.goodCondition++;
          break;
        case DeviceStatus.NEEDS_REPAIR:
          stats.needsRepair++;
          break;
        case DeviceStatus.OCCUPIED:
          stats.occupied++;
          break;
        case DeviceStatus.FAIR:
          stats.fair++;
          break;
      }

      // Contar por marca
      const count = brandMap.get(device.brand) || 0;
      brandMap.set(device.brand, count + 1);
    });

    // Top 5 marcas
    stats.devicesByBrand = Array.from(brandMap.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return stats;
  }
}

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
