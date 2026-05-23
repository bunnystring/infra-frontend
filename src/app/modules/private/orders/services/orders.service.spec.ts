import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
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
    it('debe crear una orden exitosamente', (done) => {
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Nueva orden de instalación',
        assigneeType: 'TECHNICIAN',
        assigneeId: '123e4567-e89b-12d3-a456-426614174000',
        devicesIds: [
          '7944b840-42f1-47f0-b00f-c3c3b616d7a7',
          'a04bb10b-4f20-43e8-a0cf-7996a43934d2',
        ],
      };

      service.createOrder(createRequest).subscribe({
        next: (order) => {
          expect(order).toEqual(mockOrder);
          expect(order.id).toBe('40ac7910-08be-44f6-ada4-60a06d8f6a18');
          expect(order.items.length).toBe(3);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockOrder);
    });

    it('debe manejar errores al crear una orden', (done) => {
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Orden inválida',
        assigneeType: 'INVALID',
        assigneeId: 'invalid-id',
        devicesIds: [],
      };

      service.createOrder(createRequest).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush('Error al crear la orden', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ── getAllOrders ───────────────────────────────────────────────────────────
  describe('getAllOrders', () => {
    it('debe obtener todas las órdenes', (done) => {
      service.getAllOrders().subscribe({
        next: (orders) => {
          expect(orders.length).toBe(1);
          expect(orders[0]).toEqual(mockOrder);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      expect(req.request.method).toBe('GET');
      req.flush([mockOrder]);
    });

    it('debe retornar un array vacío cuando no hay órdenes', (done) => {
      service.getAllOrders().subscribe({
        next: (orders) => {
          expect(orders.length).toBe(0);
          expect(orders).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush([]);
    });

    it('debe manejar errores al obtener órdenes', (done) => {
      service.getAllOrders().subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ── getOrderById ──────────────────────────────────────────────────────────
  describe('getOrderById', () => {
    it('debe obtener una orden por ID', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';

      service.getOrderById(orderId).subscribe({
        next: (order) => {
          expect(order).toEqual(mockOrder);
          expect(order.id).toBe(orderId);
          expect(order.items.length).toBe(3);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}`));
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });

    it('debe manejar error 404 cuando la orden no existe', (done) => {
      const orderId = 'non-existent-id';

      service.getOrderById(orderId).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}`));
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── updateOrderState ──────────────────────────────────────────────────────
  describe('updateOrderState', () => {
    it('debe actualizar el estado de una orden usando FormData', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const newState = OrderStates.IN_PROCESS;
      const updatedOrder: Order = { ...mockOrder, state: OrderStates.IN_PROCESS };

      service.updateOrderState(orderId, newState).subscribe({
        next: (order) => {
          expect(order.state).toBe(OrderStates.IN_PROCESS);
          expect(order.id).toBe(orderId);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('newState')).toBe(newState);
      req.flush(updatedOrder);
    });

    it('debe actualizar el estado a CREATED', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updatedOrder: Order = { ...mockOrder, state: OrderStates.CREATED };

      service.updateOrderState(orderId, OrderStates.CREATED).subscribe({
        next: (order) => {
          expect(order.state).toBe(OrderStates.CREATED);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      expect((req.request.body as FormData).get('newState')).toBe(OrderStates.CREATED);
      req.flush(updatedOrder);
    });

    it('debe actualizar el estado a DISPATCHED', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updatedOrder: Order = { ...mockOrder, state: OrderStates.DISPATCHED };

      service.updateOrderState(orderId, OrderStates.DISPATCHED).subscribe({
        next: (order) => {
          expect(order.state).toBe(OrderStates.DISPATCHED);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      expect((req.request.body as FormData).get('newState')).toBe(OrderStates.DISPATCHED);
      req.flush(updatedOrder);
    });

    it('debe manejar errores al actualizar el estado', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';

      service.updateOrderState(orderId, 'INVALID_STATE').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      req.flush('Invalid state', { status: 400, statusText: 'Bad Request' });
    });

    it('debe manejar error 404 cuando la orden no existe al actualizar estado', (done) => {
      const orderId = 'non-existent-id';

      service.updateOrderState(orderId, OrderStates.IN_PROCESS).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── updateOrder ───────────────────────────────────────────────────────────
  describe('updateOrder', () => {
    it('debe actualizar una orden exitosamente', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updateRequest: Partial<CreateOrderRequest> = {
        description: 'Descripción actualizada',
        assigneeType: 'EMPLOYEE',
        assigneeId: 'emp-123',
        devicesIds: ['dev-1'],
      };
      const updatedOrder: Order = { ...mockOrder, description: 'Descripción actualizada' };

      service.updateOrder(orderId, updateRequest).subscribe({
        next: (order) => {
          expect(order.description).toBe('Descripción actualizada');
          expect(order.id).toBe(orderId);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/update/${orderId}`));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedOrder);
    });

    it('debe manejar error al actualizar una orden inexistente', (done) => {
      const orderId = 'non-existent-id';

      service.updateOrder(orderId, { description: 'Test' }).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/update/${orderId}`));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ── Integración con ApiService ────────────────────────────────────────────
  describe('Integración con ApiService', () => {
    it('debe usar ApiService.get para obtener todas las órdenes', (done) => {
      const spy = spyOn(apiService, 'get').and.callThrough();

      service.getAllOrders().subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith('/orders');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush([]);
    });

    it('debe usar ApiService.post para crear órdenes', (done) => {
      const spy = spyOn(apiService, 'post').and.callThrough();
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Test',
        assigneeType: 'GROUP',
        assigneeId: 'test-id',
        devicesIds: [],
      };

      service.createOrder(createRequest).subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith('/orders', createRequest);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush(mockOrder);
    });

    it('debe usar ApiService.putFormData para actualizar estado', (done) => {
      const spy = spyOn(apiService, 'putFormData').and.callThrough();
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';

      service.updateOrderState(orderId, OrderStates.IN_PROCESS).subscribe({
        next: () => {
          expect(spy).toHaveBeenCalled();
          const [url, body] = spy.calls.mostRecent().args;
          expect(url).toBe(`/orders/${orderId}/state`);
          expect(body instanceof FormData).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${orderId}/state`));
      req.flush(mockOrder);
    });

    it('debe usar ApiService.put para actualizar una orden', (done) => {
      const spy = spyOn(apiService, 'put').and.callThrough();
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const updateRequest: Partial<CreateOrderRequest> = { description: 'Actualizada' };

      service.updateOrder(orderId, updateRequest).subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith(`/orders/update/${orderId}`, updateRequest);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/update/${orderId}`));
      req.flush(mockOrder);
    });
  });

  // ── Casos Edge ────────────────────────────────────────────────────────────
  describe('Casos Edge', () => {
    it('debe manejar órdenes con múltiples dispositivos de distintos estados', (done) => {
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

      service.getOrderById(mockOrder.id).subscribe({
        next: (order) => {
          expect(order.items.length).toBe(5);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${mockOrder.id}`));
      req.flush(orderWithManyDevices);
    });

    it('debe manejar órdenes sin dispositivos', (done) => {
      const orderWithoutDevices: Order = { ...mockOrder, items: [] };

      service.getOrderById(mockOrder.id).subscribe({
        next: (order) => {
          expect(order.items.length).toBe(0);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${mockOrder.id}`));
      req.flush(orderWithoutDevices);
    });

    it('debe manejar órdenes con descripción larga', (done) => {
      const orderWithLongDescription: Order = { ...mockOrder, description: 'A'.repeat(500) };

      service.getOrderById(mockOrder.id).subscribe({
        next: (order) => {
          expect(order.description.length).toBe(500);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((r) => r.url.includes(`/orders/${mockOrder.id}`));
      req.flush(orderWithLongDescription);
    });

    it('debe manejar errores de red (status 0)', (done) => {
      service.getAllOrders().subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(0);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/orders'));
      req.flush(null, { status: 0, statusText: 'Network Error' });
    });
  });
});
