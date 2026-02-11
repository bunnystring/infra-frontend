import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService } from './orders.service';
import { ApiService } from '../../../../core/services/api.service';
import { Order, CreateOrderRequest } from '../models/Orders';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockOrder: Order = {
    id: '40ac7910-08be-44f6-ada4-60a06d8f6a18',
    description: 'Instalación de equipos a entregar banco davivienda',
    state: 'FINISHED',
    assigneeType: 'GROUP',
    assigneeId: '92bb39d7-8ad1-4343-98ce-db390189ca8a',
    createdAt: '2026-02-06T20:27:41.603963',
    updatedAt: '2026-02-06T20:36:40.943203',
    items: [
      { deviceId: '7944b840-42f1-47f0-b00f-c3c3b616d7a7', originalDeviceState: 'GOOD_CONDITION' },
      { deviceId: 'a04bb10b-4f20-43e8-a0cf-7996a43934d2', originalDeviceState: 'GOOD_CONDITION' },
      { deviceId: '10d62e30-aeb8-4d9a-9a71-c0e7911ca5d3', originalDeviceState: 'GOOD_CONDITION' }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdersService, ApiService]
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

  describe('createOrder', () => {
    it('debe crear una orden exitosamente', (done) => {
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Nueva orden de instalación',
        assigneeType: 'TECHNICIAN',
        assigneeId: '123e4567-e89b-12d3-a456-426614174000',
        devicesIds: [
          '7944b840-42f1-47f0-b00f-c3c3b616d7a7',
          'a04bb10b-4f20-43e8-a0cf-7996a43934d2'
        ]
      };

      service.createOrder(createRequest).subscribe({
        next: (order) => {
          expect(order).toEqual(mockOrder);
          expect(order.id).toBe('40ac7910-08be-44f6-ada4-60a06d8f6a18');
          expect(order.items.length).toBe(3);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockOrder);
    });

    it('debe manejar errores al crear una orden', (done) => {
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Orden inválida',
        assigneeType: 'INVALID',
        assigneeId: 'invalid-id',
        devicesIds: []
      };

      const errorMessage = 'Error al crear la orden';

      service.createOrder(createRequest).subscribe({
        next: () => {
          done.fail('Debería haber fallado');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error).toBe(errorMessage);
          done();
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getAllOrders', () => {
    it('debe obtener todas las órdenes', (done) => {
      const mockOrders: Order[] = [mockOrder];

      service.getAllOrders().subscribe({
        next: (orders) => {
          expect(orders.length).toBe(1);
          expect(orders[0]).toEqual(mockOrder);
          expect(orders[0].id).toBe('40ac7910-08be-44f6-ada4-60a06d8f6a18');
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      expect(req.request.method).toBe('GET');
      req.flush(mockOrders);
    });

    it('debe retornar un array vacío cuando no hay órdenes', (done) => {
      service.getAllOrders().subscribe({
        next: (orders) => {
          expect(orders.length).toBe(0);
          expect(orders).toEqual([]);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      req.flush([]);
    });

    it('debe manejar errores al obtener órdenes', (done) => {
      service.getAllOrders().subscribe({
        next: () => {
          done.fail('Debería haber fallado');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

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
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}`)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });

    it('debe manejar error 404 cuando la orden no existe', (done) => {
      const orderId = 'non-existent-id';

      service.getOrderById(orderId).subscribe({
        next: () => {
          done.fail('Debería haber fallado');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}`)
      );
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateOrderState', () => {
    it('debe actualizar el estado de una orden usando FormData', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const newState = 'IN_PROGRESS';
      const updatedOrder = { ...mockOrder, state: 'IN_PROGRESS' as const };

      service.updateOrderState(orderId, newState).subscribe({
        next: (order) => {
          expect(order.state).toBe('IN_PROGRESS');
          expect(order.id).toBe(orderId);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}/state`)
      );

      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBe(true);

      const formData = req.request.body as FormData;
      expect(formData.get('newState')).toBe(newState);

      req.flush(updatedOrder);
    });

    it('debe actualizar el estado a CREATED', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const newState = 'CREATED';
      const updatedOrder = { ...mockOrder, state: 'CREATED' as const };

      service.updateOrderState(orderId, newState).subscribe({
        next: (order) => {
          expect(order.state).toBe('CREATED');
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}/state`)
      );

      const formData = req.request.body as FormData;
      expect(formData.get('newState')).toBe('CREATED');

      req.flush(updatedOrder);
    });

    it('debe actualizar el estado a DESPATCHED', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const newState = 'DESPATCHED';
      const updatedOrder = { ...mockOrder, state: 'DESPATCHED' as const };

      service.updateOrderState(orderId, newState).subscribe({
        next: (order) => {
          expect(order.state).toBe('DESPATCHED');
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}/state`)
      );

      const formData = req.request.body as FormData;
      expect(formData.get('newState')).toBe('DESPATCHED');

      req.flush(updatedOrder);
    });

    it('debe manejar errores al actualizar el estado', (done) => {
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const newState = 'INVALID_STATE';

      service.updateOrderState(orderId, newState).subscribe({
        next: () => {
          done.fail('Debería haber fallado');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}/state`)
      );
      req.flush('Invalid state', { status: 400, statusText: 'Bad Request' });
    });

    it('debe manejar error 404 cuando la orden no existe', (done) => {
      const orderId = 'non-existent-id';
      const newState = 'IN_PROGRESS';

      service.updateOrderState(orderId, newState).subscribe({
        next: () => {
          done.fail('Debería haber fallado');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}/state`)
      );
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Integración con ApiService', () => {
    it('debe usar ApiService para las peticiones', (done) => {
      const spy = spyOn(apiService, 'get').and.callThrough();

      service.getAllOrders().subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith('/orders');
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      req.flush([]);
    });

    it('debe usar ApiService.post para crear órdenes', (done) => {
      const spy = spyOn(apiService, 'post').and.callThrough();
      const createRequest: Partial<CreateOrderRequest> = {
        description: 'Test',
        assigneeType: 'GROUP',
        assigneeId: 'test-id',
        devicesIds: []
      };

      service.createOrder(createRequest).subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith('/orders', createRequest);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/orders'));
      req.flush(mockOrder);
    });

    it('debe usar ApiService.putFormData para actualizar estado', (done) => {
      const spy = spyOn(apiService, 'putFormData').and.callThrough();
      const orderId = '40ac7910-08be-44f6-ada4-60a06d8f6a18';
      const newState = 'IN_PROGRESS';

      service.updateOrderState(orderId, newState).subscribe({
        next: () => {
          expect(spy).toHaveBeenCalled();
          const callArgs = spy.calls.mostRecent().args;
          expect(callArgs[0]).toBe(`/orders/${orderId}/state`);
          expect(callArgs[1] instanceof FormData).toBe(true);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${orderId}/state`)
      );
      req.flush(mockOrder);
    });
  });

  describe('Casos Edge', () => {
    it('debe manejar órdenes con múltiples dispositivos', (done) => {
      const orderWithManyDevices: Order = {
        ...mockOrder,
        items: [
          { deviceId: 'device-1', originalDeviceState: 'GOOD_CONDITION' },
          { deviceId: 'device-2', originalDeviceState: 'FAIR' },
          { deviceId: 'device-3', originalDeviceState: 'NEEDS_REPAIR' },
          { deviceId: 'device-4', originalDeviceState: 'OCCUPIED' },
          { deviceId: 'device-5', originalDeviceState: 'GOOD_CONDITION' }
        ]
      };

      service.getOrderById(mockOrder.id).subscribe({
        next: (order) => {
          expect(order.items.length).toBe(5);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${mockOrder.id}`)
      );
      req.flush(orderWithManyDevices);
    });

    it('debe manejar órdenes sin dispositivos', (done) => {
      const orderWithoutDevices: Order = {
        ...mockOrder,
        items: []
      };

      service.getOrderById(mockOrder.id).subscribe({
        next: (order) => {
          expect(order.items.length).toBe(0);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${mockOrder.id}`)
      );
      req.flush(orderWithoutDevices);
    });

    it('debe manejar órdenes con descripción larga', (done) => {
      const orderWithLongDescription: Order = {
        ...mockOrder,
        description: 'A'.repeat(500)
      };

      service.getOrderById(mockOrder.id).subscribe({
        next: (order) => {
          expect(order.description.length).toBe(500);
          done();
        },
        error: (error) => {
          done.fail(error);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`/orders/${mockOrder.id}`)
      );
      req.flush(orderWithLongDescription);
    });
  });
  
});
