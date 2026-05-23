import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { OrdersService } from './orders.service';
import { ApiService } from '../../../../core/services/api.service';
import { Order, CreateOrderRequest, OrderStates } from '../models/orders.model';
import { DeviceStatus } from '../../devices/models/device.model';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockOrder: Order = {
    id: '40ac7910-08be-44f6-ada4-60a06d8f6a18',
    description: 'Instalación de equipos a entregar banco davivienda',
    state: OrderStates.FINISHED,
    assigneeType: 'GROUP',
    assigneeId: '92bb39d7-8ad1-4343-98ce-db390189ca8a',
    createdAt: '2026-02-06T20:27:41.603963',
    updatedAt: '2026-02-06T20:36:40.943203',
    assignee: null,
    items: [
      { deviceId: '7944b840-42f1-47f0-b00f-c3c3b616d7a7', originalDeviceState: DeviceStatus.GOOD_CONDITION },
      { deviceId: 'a04bb10b-4f20-43e8-a0cf-7996a43934d2', originalDeviceState: DeviceStatus.GOOD_CONDITION },
      { deviceId: '10d62e30-aeb8-4d9a-9a71-c0e7911ca5d3', originalDeviceState: DeviceStatus.GOOD_CONDITION },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe ser creado', () => {
    expect(service).toBeTruthy();
  });

  // ── createOrder ───────────────────────────────────────────────────────────
  describe('createOrder', () => {
    it('debe crear una orden exitosamente', async () => {
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Nueva orden de instalación',
        assigneeType: 'TECHNICIAN',
        assigneeId: '123e4567-e89b-12d3-a456-426614174000',
        devicesIds: ['7944b840-42f1-47f0-b00f-c3c3b616d7a7', 'a04bb10b-4f20-43e8-a0cf-7996a43934d2'],
      };

      const promise = lastValueFrom(service.createOrder(createRequest));
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockOrder);

      const order = await promise;
      expect(order).toEqual(mockOrder);
      expect(order.id).toBe('40ac7910-08be-44f6-ada4-60a06d8f6a18');
      expect(order.items.length).toBe(3);
    });

    it('debe manejar errores al crear una orden', async () => {
      const createRequest: Partial<CreateOrderRequest> = { description: 'Orden inválida', assigneeType: 'INVALID', assigneeId: 'invalid-id', devicesIds: [] };

      const promise = lastValueFrom(service.createOrder(createRequest));
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush('Error al crear la orden', { status: 400, statusText: 'Bad Request' });

      await expect(promise).rejects.toMatchObject({ status: 400 });
    });
  });

  // ── getAllOrders ───────────────────────────────────────────────────────────
  describe('getAllOrders', () => {
    it('debe obtener todas las órdenes', async () => {
      const promise = lastValueFrom(service.getAllOrders());
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      expect(req.request.method).toBe('GET');
      req.flush([mockOrder]);

      const orders = await promise;
      expect(orders.length).toBe(1);
      expect(orders[0]).toEqual(mockOrder);
    });

    it('debe retornar un array vacío cuando no hay órdenes', async () => {
      const promise = lastValueFrom(service.getAllOrders());
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush([]);

      const orders = await promise;
      expect(orders.length).toBe(0);
      expect(orders).toEqual([]);
    });

    it('debe manejar errores al obtener órdenes', async () => {
      const promise = lastValueFrom(service.getAllOrders());
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      await expect(promise).rejects.toMatchObject({ status: 500 });
    });
  });

  // ── getOrderById ──────────────────────────────────────────────────────────
  describe('getOrderById', () => {
    it('debe obtener una orden por ID', async () => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';

      const promise = lastValueFrom(service.getOrderById(orderId));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}`));
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);

      const order = await promise;
      expect(order).toEqual(mockOrder);
      expect(order.id).toBe(orderId);
      expect(order.items.length).toBe(3);
    });

    it('debe manejar error 404 cuando la orden no existe', async () => {
      const orderId = 'non-existent-id';

      const promise = lastValueFrom(service.getOrderById(orderId));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}`));
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── updateOrderState ──────────────────────────────────────────────────────
  describe('updateOrderState', () => {
    it('debe actualizar el estado de una orden usando FormData', async () => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updatedOrder: Order = { ...mockOrder, state: OrderStates.IN_PROCESS };

      const promise = lastValueFrom(service.updateOrderState(orderId, OrderStates.IN_PROCESS));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('newState')).toBe(OrderStates.IN_PROCESS);
      req.flush(updatedOrder);

      const order = await promise;
      expect(order.state).toBe(OrderStates.IN_PROCESS);
      expect(order.id).toBe(orderId);
    });

    it('debe actualizar el estado a CREATED', async () => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updatedOrder: Order = { ...mockOrder, state: OrderStates.CREATED };

      const promise = lastValueFrom(service.updateOrderState(orderId, OrderStates.CREATED));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      expect((req.request.body as FormData).get('newState')).toBe(OrderStates.CREATED);
      req.flush(updatedOrder);

      const order = await promise;
      expect(order.state).toBe(OrderStates.CREATED);
    });

    it('debe actualizar el estado a DISPATCHED', async () => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updatedOrder: Order = { ...mockOrder, state: OrderStates.DISPATCHED };

      const promise = lastValueFrom(service.updateOrderState(orderId, OrderStates.DISPATCHED));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      expect((req.request.body as FormData).get('newState')).toBe(OrderStates.DISPATCHED);
      req.flush(updatedOrder);

      const order = await promise;
      expect(order.state).toBe(OrderStates.DISPATCHED);
    });

    it('debe manejar errores al actualizar el estado', async () => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';

      const promise = lastValueFrom(service.updateOrderState(orderId, 'INVALID_STATE'));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      req.flush('Invalid state', { status: 400, statusText: 'Bad Request' });

      await expect(promise).rejects.toMatchObject({ status: 400 });
    });

    it('debe manejar error 404 cuando la orden no existe al actualizar estado', async () => {
      const orderId = 'non-existent-id';

      const promise = lastValueFrom(service.updateOrderState(orderId, OrderStates.IN_PROCESS));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── updateOrder ───────────────────────────────────────────────────────────
  describe('updateOrder', () => {
    it('debe actualizar una orden exitosamente', async () => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updateRequest: Partial<CreateOrderRequest> = { description: 'Descripción actualizada', assigneeType: 'EMPLOYEE', assigneeId: 'emp-123', devicesIds: ['dev-1'] };
      const updatedOrder: Order = { ...mockOrder, description: 'Descripción actualizada' };

      const promise = lastValueFrom(service.updateOrder(orderId, updateRequest));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/update/${orderId}`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedOrder);

      const order = await promise;
      expect(order.description).toBe('Descripción actualizada');
      expect(order.id).toBe(orderId);
    });

    it('debe manejar error al actualizar una orden inexistente', async () => {
      const orderId = 'non-existent-id';

      const promise = lastValueFrom(service.updateOrder(orderId, { description: 'Test' }));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/update/${orderId}`));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── Integración con ApiService ────────────────────────────────────────────
  describe('Integración con ApiService', () => {
    it('debe usar ApiService.get para obtener todas las órdenes', async () => {
      const spy = vi.spyOn(apiService, 'get');

      const promise = lastValueFrom(service.getAllOrders());
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush([]);
      await promise;

      expect(spy).toHaveBeenCalledWith('/orders');
    });

    it('debe usar ApiService.post para crear órdenes', async () => {
      const spy = vi.spyOn(apiService, 'post');
      const createRequest: Partial<CreateOrderRequest> = { description: 'Test', assigneeType: 'GROUP', assigneeId: 'test-id', devicesIds: [] };

      const promise = lastValueFrom(service.createOrder(createRequest));
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush(mockOrder);
      await promise;

      expect(spy).toHaveBeenCalledWith('/orders', createRequest);
    });

    it('debe usar ApiService.putFormData para actualizar estado', async () => {
      const spy = vi.spyOn(apiService, 'putFormData');
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';

      const promise = lastValueFrom(service.updateOrderState(orderId, OrderStates.IN_PROCESS));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      req.flush(mockOrder);
      await promise;

      expect(spy).toHaveBeenCalled();
      const [url, body] = spy.mock.calls[spy.mock.calls.length - 1];
      expect(url).toBe(`/orders/${orderId}/state`);
      expect(body instanceof FormData).toBe(true);
    });

    it('debe usar ApiService.put para actualizar una orden', async () => {
      const spy = vi.spyOn(apiService, 'put');
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updateRequest: Partial<CreateOrderRequest> = { description: 'Actualizada' };

      const promise = lastValueFrom(service.updateOrder(orderId, updateRequest));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/update/${orderId}`));
      req.flush(mockOrder);
      await promise;

      expect(spy).toHaveBeenCalledWith(`/orders/update/${orderId}`, updateRequest);
    });
  });

  // ── Casos Edge ────────────────────────────────────────────────────────────
  describe('Casos Edge', () => {
    it('debe manejar órdenes con múltiples dispositivos de distintos estados', async () => {
      const orderWithManyDevices: Order = {
        ...mockOrder,
        items: [
          { deviceId: 'device-1', originalDeviceState: DeviceStatus.GOOD_CONDITION },
          { deviceId: 'device-2', originalDeviceState: DeviceStatus.FAIR },
          { deviceId: 'device-3', originalDeviceState: DeviceStatus.NEEDS_REPAIR },
          { deviceId: 'device-4', originalDeviceState: DeviceStatus.OCCUPIED },
          { deviceId: 'device-5', originalDeviceState: DeviceStatus.GOOD_CONDITION },
        ],
      };

      const promise = lastValueFrom(service.getOrderById(mockOrder.id));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${mockOrder.id}`));
      req.flush(orderWithManyDevices);

      const order = await promise;
      expect(order.items.length).toBe(5);
    });

    it('debe manejar órdenes sin dispositivos', async () => {
      const orderWithoutDevices: Order = { ...mockOrder, items: [] };

      const promise = lastValueFrom(service.getOrderById(mockOrder.id));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${mockOrder.id}`));
      req.flush(orderWithoutDevices);

      const order = await promise;
      expect(order.items.length).toBe(0);
    });

    it('debe manejar órdenes con descripción larga', async () => {
      const orderWithLongDescription: Order = { ...mockOrder, description: 'A'.repeat(500) };

      const promise = lastValueFrom(service.getOrderById(mockOrder.id));
      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${mockOrder.id}`));
      req.flush(orderWithLongDescription);

      const order = await promise;
      expect(order.description.length).toBe(500);
    });

    it('debe manejar errores de red (status 0)', async () => {
      const promise = lastValueFrom(service.getAllOrders());
      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush(null, { status: 0, statusText: 'Network Error' });

      await expect(promise).rejects.toMatchObject({ status: 0 });
    });
  });
});
