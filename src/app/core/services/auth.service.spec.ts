import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../modules/public/auth/models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  const mockLoginRequest: LoginRequest = { email: 'test@example.com', password: 'password123' };
  const mockRegisterRequest: RegisterRequest = { email: 'newuser@example.com', password: 'password123', name: 'Test User' };
  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: { email: 'test@example.com', name: 'Test User' },
  };

  const createMockToken = (expiresInMinutes = 30): string => {
    const payload = { sub: '1', email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60 };
    return `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(JSON.stringify(payload))}.mock-signature`;
  };

  beforeEach(() => {
    const routerSpyObj = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [AuthService, ApiService, provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: routerSpyObj }],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as unknown as typeof routerSpyObj;
    localStorage.clear();
  });

  afterEach(() => { httpMock.verify(); localStorage.clear(); });

  describe('Login', () => {
    it('debe ser creado', () => { expect(service).toBeTruthy(); });

    it('debe hacer login exitosamente y guardar datos en localStorage', async () => {
      const promise = lastValueFrom(service.login(mockLoginRequest));
      const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);
      req.flush(mockAuthResponse);

      const response = await promise;
      expect(response).toEqual(mockAuthResponse);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refreshToken);
      expect(localStorage.getItem('user_data')).toBe(JSON.stringify(mockAuthResponse.user));
    });

    it('debe actualizar el currentUser$ al hacer login', async () => {
      const promise = lastValueFrom(service.login(mockLoginRequest));
      const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
      req.flush(mockAuthResponse);
      await promise;

      const user = await firstValueFrom(service.currentUser$);
      expect(user).toEqual(mockAuthResponse.user);
    });

    it('debe manejar errores de login', async () => {
      const promise = lastValueFrom(service.login(mockLoginRequest));
      const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
      req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

      await expect(promise).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('Register', () => {
    it('debe registrar usuario exitosamente', async () => {
      const promise = lastValueFrom(service.register(mockRegisterRequest));
      const req = httpMock.expectOne(r => r.url.includes('/auth/register'));
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);

      const response = await promise;
      expect(response).toEqual(mockAuthResponse);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
    });
  });

  describe('Logout', () => {
    it('debe limpiar localStorage y redirigir al login', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');
      localStorage.setItem('user_data', JSON.stringify({ id: '1' }));
      service.logout();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('debe actualizar currentUser$ a null tras logout', async () => {
      localStorage.setItem('auth_token', 'test-token');
      service.logout();
      const user = await firstValueFrom(service.currentUser$);
      expect(user).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('getToken debe retornar el token del localStorage', () => {
      localStorage.setItem('auth_token', 'test-token-123');
      expect(service.getToken()).toBe('test-token-123');
    });

    it('getToken debe retornar null si no hay token', () => { expect(service.getToken()).toBeNull(); });

    it('getRefreshToken debe retornar el refresh token', () => {
      localStorage.setItem('refresh_token', 'test-refresh-123');
      expect(service.getRefreshToken()).toBe('test-refresh-123');
    });

    it('isAuthenticated debe retornar true si hay token', () => {
      localStorage.setItem('auth_token', 'test-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated debe retornar false si no hay token', () => { expect(service.isAuthenticated()).toBe(false); });
  });

  describe('Token Expiration', () => {
    it('isTokenExpired debe retornar true si el token expiró', () => {
      localStorage.setItem('auth_token', createMockToken(-10));
      expect(service.isTokenExpired()).toBe(true);
    });

    it('isTokenExpired debe retornar false si el token es válido', () => {
      localStorage.setItem('auth_token', createMockToken(30));
      expect(service.isTokenExpired()).toBe(false);
    });

    it('isTokenExpired debe retornar true si no hay token', () => { expect(service.isTokenExpired()).toBe(true); });

    it('isTokenExpired debe manejar tokens malformados', () => {
      localStorage.setItem('auth_token', 'invalid-token');
      expect(service.isTokenExpired()).toBe(true);
    });

    it('isTokenExpiringSoon debe retornar true si expira en menos de 5 minutos', () => {
      localStorage.setItem('auth_token', createMockToken(3));
      expect(service.isTokenExpiringSoon()).toBe(true);
    });

    it('isTokenExpiringSoon debe retornar false si expira en más de 5 minutos', () => {
      localStorage.setItem('auth_token', createMockToken(10));
      expect(service.isTokenExpiringSoon()).toBe(false);
    });

    it('isTokenExpiringSoon debe aceptar parámetro de minutos personalizado', () => {
      localStorage.setItem('auth_token', createMockToken(8));
      expect(service.isTokenExpiringSoon(10)).toBe(true);
      expect(service.isTokenExpiringSoon(5)).toBe(false);
    });

    it('getTokenExpirationTime debe retornar el tiempo restante en ms', () => {
      localStorage.setItem('auth_token', createMockToken(5));
      const time = service.getTokenExpirationTime();
      expect(time).not.toBeNull();
      expect(time!).toBeGreaterThan(0);
      expect(time!).toBeLessThanOrEqual(5 * 60 * 1000);
    });

    it('getTokenExpirationTime debe retornar null si no hay token', () => { expect(service.getTokenExpirationTime()).toBeNull(); });

    it('getTokenExpirationTime debe retornar 0 si el token ya expiró', () => {
      localStorage.setItem('auth_token', createMockToken(-10));
      expect(service.getTokenExpirationTime()).toBe(0);
    });
  });

  describe('Refresh Token', () => {
    it('debe refrescar el token exitosamente', async () => {
      localStorage.setItem('refresh_token', 'old-refresh-token');
      const newAuthResponse: AuthResponse = { ...mockAuthResponse, accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      const promise = lastValueFrom(service.refreshToken());
      const req = httpMock.expectOne(r => r.url.includes('/auth/refresh'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(newAuthResponse);

      const response = await promise;
      expect(response).toEqual(newAuthResponse);
      expect(localStorage.getItem('auth_token')).toBe('new-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    });

    it('debe limpiar datos si el refresh falla', async () => {
      localStorage.setItem('auth_token', 'old-token');
      localStorage.setItem('refresh_token', 'old-refresh');
      localStorage.setItem('user_data', JSON.stringify({ id: '1' }));

      const promise = lastValueFrom(service.refreshToken());
      const req = httpMock.expectOne(r => r.url.includes('/auth/refresh'));
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });

      await expect(promise).rejects.toBeDefined();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });

    it('debe retornar error si no hay refresh token', async () => {
      const promise = lastValueFrom(service.refreshToken());
      httpMock.expectNone(r => r.url.includes('/auth/refresh'));
      await expect(promise).rejects.toMatchObject({ message: 'No refresh token available' });
    });
  });

  describe('Get Current User', () => {
    it('debe retornar el usuario actual', () => {
      const user = { email: 'test@example.com', name: 'Test' };
      localStorage.setItem('user_data', JSON.stringify(user));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [AuthService, ApiService, provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: { navigate: vi.fn() } }],
      });
      const newService = TestBed.inject(AuthService);
      expect(newService.getCurrentUser()).toEqual(user);
    });

    it('debe retornar null si no hay usuario', () => { expect(service.getCurrentUser()).toBeNull(); });
  });
});
