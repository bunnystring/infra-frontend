import { Device, DeviceStatus } from "../../devices/models/device.model";

export enum OrderStates {
  CREATED = 'CREATED',
  IN_PROCESS = 'IN_PROCESS',
  DISPATCHED = 'DISPATCHED',
  FINISHED = 'FINISHED',
  CREATED_WITH_ERRORS = 'CREATED_WITH_ERRORS'
}

export const OrderStateLabels: { [key in OrderStates]: string } = {
  [OrderStates.CREATED]: 'Creada',
  [OrderStates.IN_PROCESS]: 'En Proceso',
  [OrderStates.DISPATCHED]: 'Despachada',
  [OrderStates.FINISHED]: 'Finalizada',
  [OrderStates.CREATED_WITH_ERRORS]: 'Creada con errores',
};

export const OrderStatusColors: { [key in OrderStates]: string } = {
  [OrderStates.CREATED]: 'success',
  [OrderStates.IN_PROCESS]: 'warning',
  [OrderStates.DISPATCHED]: 'primary',
  [OrderStates.FINISHED]: 'success',
  [OrderStates.CREATED_WITH_ERRORS]: 'error'
};

export interface OrderItem {
  deviceId: string;
  originalDeviceState: DeviceStatus;
  device?: Device | null;
}

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

export interface CreateOrderRequest {
  description: string;
  assigneeType: string;
  assigneeId: string;
  devicesIds: string[];
}


export interface UpdateOrderRequest {
  description?: string;
  state?: OrderStates;
  assigneeType?: string;
  assigneeId?: string;
  devicesIds?: string[];
}

export interface OrderStats {
  total: number;
  created: number;
  inProgress: number;
  despatched: number;
  finished: number;
  averageItemsPerOrder: number;
  totalDevicesInOrders: number;
}

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

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}


