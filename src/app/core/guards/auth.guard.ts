import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, of, map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  // Obtener tiempo restante del token para logs más informativos
  const timeRemaining = authService.getTokenExpirationTime();
  const minutesRemaining = timeRemaining
    ? Math.floor(timeRemaining / 60000)
    : 0;
  const secondsRemaining = timeRemaining
    ? Math.floor((timeRemaining % 60000) / 1000)
    : 0;

  // Si el token ha expirado o está por expirar, intentar refrescarlo
  if (authService.isTokenExpired() || authService.isTokenExpiringSoon()) {
    return authService.refreshToken().pipe(
      map(() => {
        return true;
      }),
      catchError((error) => {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });

        return of(false);
      }),
    );
  }
  return true;
};
