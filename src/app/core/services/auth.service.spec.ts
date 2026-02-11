import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../../modules/public/auth/models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let apiService: ApiService;

  const mockLoginRequest: LoginRequest = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRegisterRequest: RegisterRequest = {
    email: 'newuser@example.com',
    password: 'password123',
    name: 'Test User',
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  const createMockToken = (expiresInMinutes: number = 30): string => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: '1',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
    };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    return `${encodedHeader}.${encodedPayload}.mock-signature`;
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        ApiService,
        { provide: Router, useValue: routerSpyObj },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    apiService = TestBed.inject(ApiService);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Login', () => {
    it('debe ser creado', () => {
      expect(service).toBeTruthy();
    });

    it('debe hacer login exitosamente y guardar datos en localStorage', (done) => {
      service.login(mockLoginRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(localStorage.getItem('auth_token')).toBe(
            mockAuthResponse.accessToken,
          );
          expect(localStorage.getItem('refresh_token')).toBe(
            mockAuthResponse.refreshToken,
          );
          expect(localStorage.getItem('user_data')).toBe(
            JSON.stringify(mockAuthResponse.user),
          );
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/auth/login'),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);
      req.flush(mockAuthResponse);
    });

    it('debe actualizar el currentUser$ al hacer login', (done) => {
      service.currentUser$.subscribe((user) => {
        if (user) {
          expect(user).toEqual(mockAuthResponse.user);
          done();
        }
      });

      service.login(mockLoginRequest).subscribe();

      const req = httpMock.expectOne((request) =>
        request.url.includes('/auth/login'),
      );
      req.flush(mockAuthResponse);
    });

    it('debe manejar errores de login', (done) => {
      const errorMessage = 'Credenciales inválidas';

      service.login(mockLoginRequest).subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error.message).toBe(errorMessage);
          done();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/auth/login'),
      );
      req.flush(
        { message: errorMessage },
        { status: 401, statusText: 'Unauthorized' },
      );
    });
  });

  describe('Register', () => {
    it('debe registrar usuario exitosamente', (done) => {
      service.register(mockRegisterRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(localStorage.getItem('auth_token')).toBe(
            mockAuthResponse.accessToken,
          );
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/auth/register'),
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
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

    it('debe actualizar currentUser$ a null', (done) => {
      localStorage.setItem('auth_token', 'test-token');

      service.logout();

      service.currentUser$.subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('Token Management', () => {
    it('getToken debe retornar el token del localStorage', () => {
      const testToken = 'test-token-123';
      localStorage.setItem('auth_token', testToken);

      expect(service.getToken()).toBe(testToken);
    });

    it('getToken debe retornar null si no hay token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('getRefreshToken debe retornar el refresh token', () => {
      const testRefreshToken = 'test-refresh-123';
      localStorage.setItem('refresh_token', testRefreshToken);

      expect(service.getRefreshToken()).toBe(testRefreshToken);
    });

    it('isAuthenticated debe retornar true si hay token', () => {
      localStorage.setItem('auth_token', 'test-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated debe retornar false si no hay token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Token Expiration', () => {
    it('isTokenExpired debe retornar true si el token expiró', () => {
      const expiredToken = createMockToken(-10);
      localStorage.setItem('auth_token', expiredToken);

      expect(service.isTokenExpired()).toBe(true);
    });

    it('isTokenExpired debe retornar false si el token es válido', () => {
      const validToken = createMockToken(30);
      localStorage.setItem('auth_token', validToken);

      expect(service.isTokenExpired()).toBe(false);
    });

    it('isTokenExpired debe retornar true si no hay token', () => {
      expect(service.isTokenExpired()).toBe(true);
    });

    it('isTokenExpired debe manejar tokens malformados', () => {
      localStorage.setItem('auth_token', 'invalid-token');

      const result = service.isTokenExpired();

      expect(result).toBe(true);
    });

    it('isTokenExpiringSoon debe retornar true si expira en menos de 5 minutos', () => {
      const expiringSoonToken = createMockToken(3);
      localStorage.setItem('auth_token', expiringSoonToken);

      expect(service.isTokenExpiringSoon()).toBe(true);
    });

    it('isTokenExpiringSoon debe retornar false si expira en más de 5 minutos', () => {
      const validToken = createMockToken(10);
      localStorage.setItem('auth_token', validToken);

      expect(service.isTokenExpiringSoon()).toBe(false);
    });

    it('isTokenExpiringSoon debe aceptar parámetro de minutos personalizado', () => {
      const token = createMockToken(8);
      localStorage.setItem('auth_token', token);

      expect(service.isTokenExpiringSoon(10)).toBe(true);
      expect(service.isTokenExpiringSoon(5)).toBe(false);
    });

    it('getTokenExpirationTime debe retornar el tiempo restante en milisegundos', () => {
      const token = createMockToken(5);
      localStorage.setItem('auth_token', token);

      const timeRemaining = service.getTokenExpirationTime();
      expect(timeRemaining).not.toBeNull();
      expect(timeRemaining!).toBeGreaterThan(0);
      expect(timeRemaining!).toBeLessThanOrEqual(5 * 60 * 1000);
    });

    it('getTokenExpirationTime debe retornar null si no hay token', () => {
      expect(service.getTokenExpirationTime()).toBeNull();
    });

    it('getTokenExpirationTime debe retornar 0 si el token ya expiró', () => {
      const expiredToken = createMockToken(-10);
      localStorage.setItem('auth_token', expiredToken);

      expect(service.getTokenExpirationTime()).toBe(0);
    });
  });

  describe('Refresh Token', () => {
    it('debe refrescar el token exitosamente', (done) => {
      localStorage.setItem('refresh_token', 'old-refresh-token');

      const newAuthResponse: AuthResponse = {
        ...mockAuthResponse,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      service.refreshToken().subscribe({
        next: (response) => {
          expect(response).toEqual(newAuthResponse);
          expect(localStorage.getItem('auth_token')).toBe('new-access-token');
          expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/auth/refresh'),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(newAuthResponse);
    });

    it('debe limpiar datos si el refresh falla', (done) => {
      localStorage.setItem('auth_token', 'old-token');
      localStorage.setItem('refresh_token', 'old-refresh');
      localStorage.setItem('user_data', JSON.stringify({ id: '1' }));

      service.refreshToken().subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(localStorage.getItem('auth_token')).toBeNull();
          expect(localStorage.getItem('refresh_token')).toBeNull();
          expect(localStorage.getItem('user_data')).toBeNull();
          done();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/auth/refresh'),
      );
      req.flush(
        { message: 'Invalid refresh token' },
        { status: 401, statusText: 'Unauthorized' },
      );
    });

    it('debe retornar error si no hay refresh token', (done) => {
      service.refreshToken().subscribe({
        next: () => done.fail('Debería haber fallado'),
        error: (error) => {
          expect(error.message).toBe('No refresh token available');
          done();
        },
      });

      httpMock.expectNone((request) => request.url.includes('/auth/refresh'));
    });
  });

  describe('Get Current User', () => {
    it('debe retornar el usuario actual', () => {
      const user = { email: 'test@example.com', name: 'Test' };
      localStorage.setItem('user_data', JSON.stringify(user));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          ApiService,
          { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        ],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getCurrentUser()).toEqual(user);
    });

    it('debe retornar null si no hay usuario', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});
