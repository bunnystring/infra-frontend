
export interface DashboardStatsDevices {
  totalDevices: number;
}

export interface DashboardStatsOrders {
  activeOrders: number;
  endsOrders: number;
  totalOrders: number;
}

export interface DashboardStatsEmplyees {
  employeesTotal: number;
  activeEmployees: number;
}

export interface DashboardStatsGroups {
  totalGroups: number;
  activeGroups: number;
}

export interface Alerta {
  type: string;
  icon: string;
  title: string;
  message: string;
  count: number;
}

export type DashboardStatsType = {
  totalDevices: number;
  goodCondition: number;
  occupied: number;
  needsRepair: number;
  fair: number;
  totalOrders: number;
  activeOrders: number;
  createdOrders: number;
  inProcessOrders: number;
  despatchedOrders: number;
  finishedOrders: number;
  totalDevicesInOrders: number;
  averageItemsPerOrder: number;
};

export const DEFAULT_STATS: DashboardStatsType = {
  totalDevices: 0, goodCondition: 0, occupied: 0, needsRepair: 0, fair: 0,
  totalOrders: 0, activeOrders: 0, createdOrders: 0, inProcessOrders: 0,
  despatchedOrders: 0, finishedOrders: 0, totalDevicesInOrders: 0, averageItemsPerOrder: 0,
};
