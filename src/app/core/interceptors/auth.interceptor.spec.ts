import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../../modules/public/auth/models/auth.model';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    user: { email: 'test@example.com', name: 'Test' }
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'getRefreshToken',
      'refreshToken',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Silenciar console
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');
  });

  afterEach(() => {
    // Verificar que no hay peticiones pendientes
    httpMock.verify();
  });

  describe('Token Injection', () => {
    it('debe agregar el token de autorización a las peticiones', () => {
      authService.getToken.and.returnValue('test-token-123');

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush({});
    });

    it('NO debe agregar token a /auth/login', () => {
      httpClient.post('/auth/login', {}).subscribe();

      const req = httpMock.expectOne('/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('NO debe agregar token a /auth/register', () => {
      httpClient.post('/auth/register', {}).subscribe();

      const req = httpMock.expectOne('/auth/register');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('NO debe agregar token a /auth/refresh', () => {
      httpClient.post('/auth/refresh', {}).subscribe();

      const req = httpMock.expectOne('/auth/refresh');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('debe continuar sin token si no hay token disponible', () => {
      authService.getToken.and.returnValue(null);

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 Error Handling', () => {
    it('debe refrescar el token y reintentar la petición en error 401', (done) => {
      authService.getToken.and.returnValue('old-token');
      authService.getRefreshToken.and.returnValue('refresh-token');
      authService.refreshToken.and.returnValue(of(mockAuthResponse));

      httpClient.get('/api/protected-resource').subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
          expect(authService.refreshToken).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });

      // Primera petición con token viejo - falla con 401
      const firstReq = httpMock.expectOne('/api/protected-resource');
      expect(firstReq.request.headers.get('Authorization')).toBe('Bearer old-token');
      firstReq.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      // Esperar un tick para que se procese el refresh
      setTimeout(() => {
        // Actualizar el token después del refresh
        authService.getToken.and.returnValue('new-access-token');

        // Segundo intento con nuevo token - éxito
        const retryReq = httpMock.expectOne('/api/protected-resource');
        expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
        retryReq.flush({ success: true });
      }, 0);
    });

    it('debe hacer logout si el refresh falla', (done) => {
      authService.getToken.and.returnValue('old-token');
      authService.getRefreshToken.and.returnValue('invalid-refresh');
      authService.refreshToken.and.returnValue(
        throwError(() => new HttpErrorResponse({
          error: { message: 'Refresh failed' },
          status: 401,
          statusText: 'Unauthorized'
        }))
      );

      httpClient.get('/api/protected-resource').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(authService.logout).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/protected-resource');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('NO debe intentar refresh si no hay refresh token', (done) => {
      authService.getToken.and.returnValue('test-token');
      authService.getRefreshToken.and.returnValue(null);

      httpClient.get('/api/protected-resource').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(authService.refreshToken).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/protected-resource');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('NO debe intentar refresh en la petición /auth/refresh', (done) => {
      authService.getRefreshToken.and.returnValue('refresh-token');

      httpClient.post('/auth/refresh', { refreshToken: 'refresh-token' }).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(authService.refreshToken).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/auth/refresh');
      req.flush(
        { message: 'Invalid token' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('Other Error Handling', () => {
    it('debe propagar errores que no sean 401', (done) => {
      authService.getToken.and.returnValue('test-token');

      httpClient.get('/api/users').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(authService.refreshToken).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/users');
      req.flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('debe propagar errores 403 sin intentar refresh', (done) => {
      authService.getToken.and.returnValue('test-token');

      httpClient.get('/api/admin').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(403);
          expect(authService.refreshToken).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/admin');
      req.flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' }
      );
    });

    it('debe manejar errores de red', (done) => {
      authService.getToken.and.returnValue('test-token');

      httpClient.get('/api/users').subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(0);
          expect(authService.refreshToken).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/users');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Network error'
      });
    });
  });

  describe('Multiple Requests', () => {
    it('debe manejar múltiples peticiones concurrentes con 401', (done) => {
      authService.getToken.and.returnValue('old-token');
      authService.getRefreshToken.and.returnValue('refresh-token');

      // Mock del refreshToken para que siempre retorne el mismo observable
      let refreshCalled = false;
      authService.refreshToken.and.callFake(() => {
        if (!refreshCalled) {
          refreshCalled = true;
        }
        return of(mockAuthResponse);
      });

      let completedRequests = 0;
      const totalRequests = 2;

      const checkCompletion = () => {
        completedRequests++;
        if (completedRequests === totalRequests) {
          // Verificar que refresh fue llamado (puede ser más de una vez en concurrencia)
          expect(authService.refreshToken).toHaveBeenCalled();
          done();
        }
      };

      // Petición 1
      httpClient.get('/api/resource1').subscribe({
        next: (data) => {
          expect(data).toEqual({ data: 'resource1' });
          checkCompletion();
        },
        error: done.fail
      });

      // Petición 2
      httpClient.get('/api/resource2').subscribe({
        next: (data) => {
          expect(data).toEqual({ data: 'resource2' });
          checkCompletion();
        },
        error: done.fail
      });

      // Primera petición falla con 401
      const req1 = httpMock.expectOne('/api/resource1');
      req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      // Segunda petición falla con 401
      const req2 = httpMock.expectOne('/api/resource2');
      req2.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      setTimeout(() => {
        authService.getToken.and.returnValue('new-access-token');

        // Reintentos exitosos
        const retryReq1 = httpMock.expectOne('/api/resource1');
        retryReq1.flush({ data: 'resource1' });

        const retryReq2 = httpMock.expectOne('/api/resource2');
        retryReq2.flush({ data: 'resource2' });
      }, 10);
    });
  });
});
