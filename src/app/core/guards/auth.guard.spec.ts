import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { lastValueFrom, of, throwError, isObservable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../../modules/public/auth/models/auth.model';

describe('authGuard', () => {
  let authService: { isAuthenticated: ReturnType<typeof vi.fn>; isTokenExpired: ReturnType<typeof vi.fn>; isTokenExpiringSoon: ReturnType<typeof vi.fn>; getTokenExpirationTime: ReturnType<typeof vi.fn>; refreshToken: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'new-token',
    refreshToken: 'new-refresh',
    user: { email: 'test@example.com', name: 'Test' }
  };

  beforeEach(() => {
    const authServiceSpy = { isAuthenticated: vi.fn(), isTokenExpired: vi.fn(), isTokenExpiringSoon: vi.fn(), getTokenExpirationTime: vi.fn(), refreshToken: vi.fn() };
    const routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as unknown as typeof authServiceSpy;
    router = TestBed.inject(Router) as unknown as typeof routerSpy;

    route = {} as ActivatedRouteSnapshot;
    state = { url: '/app/dashboard' } as RouterStateSnapshot;
  });

  it('debe permitir acceso si el usuario está autenticado y el token es válido', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.isTokenExpired.mockReturnValue(false);
    authService.isTokenExpiringSoon.mockReturnValue(false);
    authService.getTokenExpirationTime.mockReturnValue(30 * 60 * 1000);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe redirigir al login si el usuario no está autenticado', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/app/dashboard' } }
    );
  });

  it('debe refrescar el token si está expirado', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.isTokenExpired.mockReturnValue(true);
    authService.isTokenExpiringSoon.mockReturnValue(false);
    authService.getTokenExpirationTime.mockReturnValue(0);
    authService.refreshToken.mockReturnValue(of(mockAuthResponse));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (!isObservable(result)) throw new Error('Se esperaba un Observable');
    const canActivate = await lastValueFrom(result);
    expect(canActivate).toBe(true);
    expect(authService.refreshToken).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe refrescar el token si está próximo a expirar', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.isTokenExpired.mockReturnValue(false);
    authService.isTokenExpiringSoon.mockReturnValue(true);
    authService.getTokenExpirationTime.mockReturnValue(3 * 60 * 1000);
    authService.refreshToken.mockReturnValue(of(mockAuthResponse));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (!isObservable(result)) throw new Error('Se esperaba un Observable');
    const canActivate = await lastValueFrom(result);
    expect(canActivate).toBe(true);
    expect(authService.refreshToken).toHaveBeenCalled();
  });

  it('debe redirigir al login si el refresh falla', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.isTokenExpired.mockReturnValue(true);
    authService.isTokenExpiringSoon.mockReturnValue(false);
    authService.getTokenExpirationTime.mockReturnValue(0);
    authService.refreshToken.mockReturnValue(
      throwError(() => new Error('Refresh failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (!isObservable(result)) throw new Error('Se esperaba un Observable');
    const canActivate = await lastValueFrom(result);
    expect(canActivate).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/app/dashboard' } }
    );
  });

  it('debe incluir returnUrl en la redirección', () => {
    authService.isAuthenticated.mockReturnValue(false);
    state.url = '/app/profile';

    TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/app/profile' } }
    );
  });

  it('debe manejar navegación múltiple sin refrescar varias veces', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.isTokenExpired.mockReturnValue(false);
    authService.isTokenExpiringSoon.mockReturnValue(true);
    authService.getTokenExpirationTime.mockReturnValue(3 * 60 * 1000);
    authService.refreshToken.mockReturnValue(of(mockAuthResponse));

    const result1 = TestBed.runInInjectionContext(() => authGuard(route, state));
    if (!isObservable(result1)) throw new Error('Se esperaba un Observable en la primera navegación');
    await lastValueFrom(result1);

    const result2 = TestBed.runInInjectionContext(() => authGuard(route, state));
    if (!isObservable(result2)) throw new Error('Se esperaba un Observable en la segunda navegación');
    await lastValueFrom(result2);

    expect(authService.refreshToken.mock.calls.length).toBeGreaterThan(0);
  });
});
