
/**
 * Interface que representa las estadísticas del los dispositivos en el dashboard.
 *
 * @since 2026-02-05
 * @author Bunnystring
 */
export interface DashboardStatsDevices {
  totalDevices: number;
}

/**
 * Interface que representa las estadísticas de las órdenes en el dashboard.
 * @since 2026-02-05
 * @author Bunnystring
 */
export interface DashboardStatsOrders {
  activeOrders: number;
  endsOrders: number;
  totalOrders: number;
}

/**
 * Interface que representa las estadísticas del los empleados en el dashboard.
 * @since 2026-02-05
 * @author Bunnystring
 */
export interface DashboardStatsEmplyees {
  employeesTotal: number;
  activeEmployees: number;
}

/** Interface que representa las estadísticas del los grupos en el dashboard.
 * @since 2026-02-05
 * @author Bunnystring
 */
export interface DashboardStatsGroups {
  totalGroups: number;
  activeGroups: number;
}

/**
 * Interface que representa las estadísticas generales del dashboard, combinando dispositivos, órdenes, empleados y grupos.
 * @since 2026-02-05
 * @author Bunnystring
 */
export interface Alerta {
  type: string;
  icon: string;
  title: string;
  message: string;
  count: number;
}

/**
 * Interface que representa las estadísticas generales del dashboard, combinando dispositivos, órdenes, empleados y grupos.
 * @since 2026-02-05
 * @author Bunnystring
 */
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

/**
 * Constante que representa las estadísticas por defecto del dashboard, con todos los valores inicializados a cero.
 * @since 2026-02-05
 * @author Bunnystring
 */
export const DEFAULT_STATS: DashboardStatsType = {
  totalDevices: 0, goodCondition: 0, occupied: 0, needsRepair: 0, fair: 0,
  totalOrders: 0, activeOrders: 0, createdOrders: 0, inProcessOrders: 0,
  despatchedOrders: 0, finishedOrders: 0, totalDevicesInOrders: 0, averageItemsPerOrder: 0,
};
