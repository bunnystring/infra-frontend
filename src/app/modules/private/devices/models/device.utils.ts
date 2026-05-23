import { Device, DeviceStats, DeviceStatus, DeviceStatusColors, DeviceStatusLabels } from './device.model';

export class DeviceUtils {
  static getStatusLabel(status: DeviceStatus): string {
    return DeviceStatusLabels[status] || status;
  }

  static getStatusColor(status: DeviceStatus): string {
    return DeviceStatusColors[status] || 'badge-neutral';
  }

  static isAvailable(device: Device): boolean {
    return (
      device.status === DeviceStatus.GOOD_CONDITION ||
      device.status === DeviceStatus.FAIR
    );
  }

  static needsAttention(device: Device): boolean {
    return device.status === DeviceStatus.NEEDS_REPAIR;
  }

  static isInUse(device: Device): boolean {
    return device.status === DeviceStatus.OCCUPIED;
  }

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

  static isValidBarcode(barcode: string): boolean {
    return /^[A-Z0-9]{8,}$/i.test(barcode);
  }

  static getDisplayName(device: Device): string {
    return `${device.brand} ${device.name}`;
  }

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

  static groupByStatus(devices: Device[]): Record<DeviceStatus, Device[]> {
    return devices.reduce(
      (acc, device) => {
        if (!acc[device.status]) acc[device.status] = [];
        acc[device.status].push(device);
        return acc;
      },
      {} as Record<DeviceStatus, Device[]>
    );
  }

  static groupByBrand(devices: Device[]): Record<string, Device[]> {
    return devices.reduce(
      (acc, device) => {
        if (!acc[device.brand]) acc[device.brand] = [];
        acc[device.brand].push(device);
        return acc;
      },
      {} as Record<string, Device[]>
    );
  }

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
      switch (device.status) {
        case DeviceStatus.GOOD_CONDITION: stats.goodCondition++; break;
        case DeviceStatus.NEEDS_REPAIR: stats.needsRepair++; break;
        case DeviceStatus.OCCUPIED: stats.occupied++; break;
        case DeviceStatus.FAIR: stats.fair++; break;
      }
      const count = brandMap.get(device.brand) || 0;
      brandMap.set(device.brand, count + 1);
    });

    stats.devicesByBrand = Array.from(brandMap.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return stats;
  }
}
