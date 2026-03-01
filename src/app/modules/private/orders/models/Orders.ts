import { Device, DeviceStatus } from "../../devices/models/device.model";

/**
 * Estados posibles de una orden y su traducción al español.
 * @returns Objeto con los estados de orden y sus traducciones
 */
export enum OrderStates {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  DISPATCHED = 'DISPATCHED',
  FINISHED = 'FINISHED',
}

/**
 * Labels para mostrar en UI
 */
export const OrderStateLabels: { [key in OrderStates]: string } = {
  [OrderStates.CREATED]: 'Creada',
  [OrderStates.IN_PROGRESS]: 'En Progreso',
  [OrderStates.DISPATCHED]: 'Despachada',
  [OrderStates.FINISHED]: 'Finalizada',
};

/**
 * Colores para badges en UI
 */
export const OrderStatusColors: { [key in OrderStates]: string } = {
  [OrderStates.CREATED]: 'success',
  [OrderStates.IN_PROGRESS]: 'warning',
  [OrderStates.DISPATCHED]: 'primary',
  [OrderStates.FINISHED]: 'success'
};

/**
 * Interfaz que representa los items de una orden y su estado original del dispositivo
 *
 * @returns Interfaz OrderItem
 */
export interface OrderItem {
  deviceId: string;
  originalDeviceState: DeviceStatus;
  device?: Device | null;
}

/**
 * Interfaz principal de una orden con campos esenciales para el dashboard
 *
 * @returns Interfaz Order
 */
export interface Order {
  id: string;
  description: string;
  state: OrderStates;
  assigneeType: string;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  assignee: any;
}

/**
 * Request para crear una orden con campos necesarios para el backend
 * Incluye descripción, tipo y ID del asignado, y los items de la orden
 * @returns Interfaz CreateOrderRequest
 */
export interface CreateOrderRequest {
  description: string;
  assigneeType: string;
  assigneeId: string;
  devicesIds: string[];
}


/**
 * Request para actualizar una orden
 */
export interface UpdateOrderRequest {
  description?: string;
  state?: OrderStates;
  assigneeType?: string;
  assigneeId?: string;
  devicesIds?: string[];
}

/**
 * Estadísticas de órdenes
 */
export interface OrderStats {
  total: number;
  created: number;
  inProgress: number;
  despatched: number;
  finished: number;
  averageItemsPerOrder: number;
  totalDevicesInOrders: number;
}

/**
 * Orden con información extendida del dispositivo
 * (para mostrar en el dashboard con datos enriquecidos)
 */
export interface OrderWithDevice extends Order {
  // Información enriquecida de dispositivos
  deviceNames?: string[];
  deviceBrands?: string[];
  firstDeviceName?: string;
  firstDeviceBrand?: string;
}

// Resultado del formulario de creación/edición de orden
export interface OrderFormResult {
  order: Order;
  mode: 'create' | 'edit';
}



