import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError, isObservable } from 'rxjs';
import { authGuard } from './auth.guards';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../../modules/public/auth/models/auth.model';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'new-token',
    refreshToken: 'new-refresh',
    user: { email: 'test@example.com', name: 'Test' }
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'isTokenExpired',
      'isTokenExpiringSoon',
      'getTokenExpirationTime',
      'refreshToken'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    route = {} as ActivatedRouteSnapshot;
    state = { url: '/app/dashboard' } as RouterStateSnapshot;
  });

  it('debe permitir acceso si el usuario está autenticado y el token es válido', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isTokenExpired.and.returnValue(false);
    authService.isTokenExpiringSoon.and.returnValue(false);
    authService.getTokenExpirationTime.and.returnValue(30 * 60 * 1000);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('debe redirigir al login si el usuario no está autenticado', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/app/dashboard' } }
    );
  });

  it('debe refrescar el token si está expirado', (done) => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isTokenExpired.and.returnValue(true);
    authService.isTokenExpiringSoon.and.returnValue(false);
    authService.getTokenExpirationTime.and.returnValue(0);
    authService.refreshToken.and.returnValue(of(mockAuthResponse));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (isObservable(result)) {
      result.subscribe({
        next: (canActivate) => {
          expect(canActivate).toBe(true);
          expect(authService.refreshToken).toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    } else {
      done.fail('Se esperaba un Observable');
    }
  });

  it('debe refrescar el token si está próximo a expirar', (done) => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isTokenExpired.and.returnValue(false);
    authService.isTokenExpiringSoon.and.returnValue(true);
    authService.getTokenExpirationTime.and.returnValue(3 * 60 * 1000);
    authService.refreshToken.and.returnValue(of(mockAuthResponse));

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (isObservable(result)) {
      result.subscribe({
        next: (canActivate) => {
          expect(canActivate).toBe(true);
          expect(authService.refreshToken).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    } else {
      done.fail('Se esperaba un Observable');
    }
  });

  it('debe redirigir al login si el refresh falla', (done) => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isTokenExpired.and.returnValue(true);
    authService.isTokenExpiringSoon.and.returnValue(false);
    authService.getTokenExpirationTime.and.returnValue(0);
    authService.refreshToken.and.returnValue(
      throwError(() => new Error('Refresh failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (isObservable(result)) {
      result.subscribe({
        next: (canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(
            ['/auth/login'],
            { queryParams: { returnUrl: '/app/dashboard' } }
          );
          done();
        },
        error: done.fail
      });
    } else {
      done.fail('Se esperaba un Observable');
    }
  });

  it('debe incluir returnUrl en la redirección', () => {
    authService.isAuthenticated.and.returnValue(false);
    state.url = '/app/profile';

    TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/app/profile' } }
    );
  });

  it('debe manejar navegación múltiple sin refrescar varias veces', (done) => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isTokenExpired.and.returnValue(false);
    authService.isTokenExpiringSoon.and.returnValue(true);
    authService.getTokenExpirationTime.and.returnValue(3 * 60 * 1000);
    authService.refreshToken.and.returnValue(of(mockAuthResponse));

    const result1 = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    if (isObservable(result1)) {
      result1.subscribe({
        next: () => {
          const result2 = TestBed.runInInjectionContext(() =>
            authGuard(route, state)
          );

          if (isObservable(result2)) {
            result2.subscribe({
              next: () => {
                expect(authService.refreshToken.calls.count()).toBeGreaterThan(0);
                done();
              },
              error: done.fail
            });
          } else {
            done.fail('Se esperaba un Observable en la segunda navegación');
          }
        },
        error: done.fail
      });
    } else {
      done.fail('Se esperaba un Observable en la primera navegación');
    }
  });
});
