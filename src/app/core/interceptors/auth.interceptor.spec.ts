import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { lastValueFrom, of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../../modules/public/auth/models/auth.model';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: { getToken: ReturnType<typeof vi.fn>; getRefreshToken: ReturnType<typeof vi.fn>; refreshToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    user: { email: 'test@example.com', name: 'Test' }
  };

  beforeEach(() => {
    const authServiceSpy = { getToken: vi.fn(), getRefreshToken: vi.fn(), refreshToken: vi.fn(), logout: vi.fn() };
    const routerSpy = { navigate: vi.fn() };

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
    authService = TestBed.inject(AuthService) as unknown as typeof authServiceSpy;
    router = TestBed.inject(Router) as unknown as typeof routerSpy;

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Verificar que no hay peticiones pendientes
    httpMock.verify();
  });

  describe('Token Injection', () => {
    it('debe agregar el token de autorización a las peticiones', () => {
      authService.getToken.mockReturnValue('test-token-123');

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
      authService.getToken.mockReturnValue(null);

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 Error Handling', () => {
    it('debe refrescar el token y reintentar la petición en error 401', async () => {
      authService.getToken.mockReturnValue('old-token');
      authService.getRefreshToken.mockReturnValue('refresh-token');
      authService.refreshToken.mockReturnValue(of(mockAuthResponse));

      const promise = lastValueFrom(httpClient.get('/api/protected-resource'));

      const firstReq = httpMock.expectOne('/api/protected-resource');
      expect(firstReq.request.headers.get('Authorization')).toBe('Bearer old-token');
      firstReq.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      authService.getToken.mockReturnValue('new-access-token');

      const retryReq = httpMock.expectOne('/api/protected-resource');
      expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
      retryReq.flush({ success: true });

      const data = await promise;
      expect(data).toEqual({ success: true });
      expect(authService.refreshToken).toHaveBeenCalled();
    });

    it('debe hacer logout si el refresh falla', async () => {
      authService.getToken.mockReturnValue('old-token');
      authService.getRefreshToken.mockReturnValue('invalid-refresh');
      authService.refreshToken.mockReturnValue(
        throwError(() => new HttpErrorResponse({
          error: { message: 'Refresh failed' },
          status: 401,
          statusText: 'Unauthorized'
        }))
      );

      // El interceptor devuelve EMPTY cuando falla el refresh (evita doble navegación)
      const promise = lastValueFrom(
        httpClient.get('/api/protected-resource'),
        { defaultValue: null }
      );

      const req = httpMock.expectOne('/api/protected-resource');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      const result = await promise;
      expect(result).toBeNull();
      expect(authService.logout).toHaveBeenCalled();
    });

    it('NO debe intentar refresh si no hay refresh token', async () => {
      authService.getToken.mockReturnValue('test-token');
      authService.getRefreshToken.mockReturnValue(null);

      const promise = lastValueFrom(httpClient.get('/api/protected-resource'));

      const req = httpMock.expectOne('/api/protected-resource');
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      await expect(promise).rejects.toMatchObject({ status: 401 });
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('NO debe intentar refresh en la petición /auth/refresh', async () => {
      authService.getRefreshToken.mockReturnValue('refresh-token');

      const promise = lastValueFrom(httpClient.post('/auth/refresh', { refreshToken: 'refresh-token' }));

      const req = httpMock.expectOne('/auth/refresh');
      req.flush(
        { message: 'Invalid token' },
        { status: 401, statusText: 'Unauthorized' }
      );

      await expect(promise).rejects.toMatchObject({ status: 401 });
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Other Error Handling', () => {
    it('debe propagar errores que no sean 401', async () => {
      authService.getToken.mockReturnValue('test-token');

      const promise = lastValueFrom(httpClient.get('/api/users'));

      const req = httpMock.expectOne('/api/users');
      req.flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      await expect(promise).rejects.toMatchObject({ status: 500 });
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('debe propagar errores 403 sin intentar refresh', async () => {
      authService.getToken.mockReturnValue('test-token');

      const promise = lastValueFrom(httpClient.get('/api/admin'));

      const req = httpMock.expectOne('/api/admin');
      req.flush(
        { message: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' }
      );

      await expect(promise).rejects.toMatchObject({ status: 403 });
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('debe manejar errores de red', async () => {
      authService.getToken.mockReturnValue('test-token');

      const promise = lastValueFrom(httpClient.get('/api/users'));

      const req = httpMock.expectOne('/api/users');
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Network error'
      });

      await expect(promise).rejects.toMatchObject({ status: 0 });
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Requests', () => {
    it('debe manejar múltiples peticiones concurrentes con 401', async () => {
      authService.getToken.mockReturnValue('old-token');
      authService.getRefreshToken.mockReturnValue('refresh-token');
      authService.refreshToken.mockImplementation(() => of(mockAuthResponse));

      const promise1 = lastValueFrom(httpClient.get('/api/resource1'));
      const promise2 = lastValueFrom(httpClient.get('/api/resource2'));

      const req1 = httpMock.expectOne('/api/resource1');
      req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      const req2 = httpMock.expectOne('/api/resource2');
      req2.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      await new Promise(resolve => setTimeout(resolve, 10));
      authService.getToken.mockReturnValue('new-access-token');

      const retryReq1 = httpMock.expectOne('/api/resource1');
      retryReq1.flush({ data: 'resource1' });

      const retryReq2 = httpMock.expectOne('/api/resource2');
      retryReq2.flush({ data: 'resource2' });

      const [data1, data2] = await Promise.all([promise1, promise2]);
      expect(data1).toEqual({ data: 'resource1' });
      expect(data2).toEqual({ data: 'resource2' });
      expect(authService.refreshToken).toHaveBeenCalled();
    });
  });
});
