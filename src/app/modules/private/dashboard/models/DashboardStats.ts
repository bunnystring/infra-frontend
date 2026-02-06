
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
