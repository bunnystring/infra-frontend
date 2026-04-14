import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, of, map } from 'rxjs';

/**
 * Guard funcional para proteger rutas privadas.
 * Verifica si el usuario está autenticado y si el token no ha expirado.
 *
 * @author Bunnystring
 * @since 2026-02-06
 */
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
    /* console.warn(
      `⚠️ AuthGuard: Token ${authService.isTokenExpired() ? 'expirado' : 'próximo a expirar'} ` +
        `(${minutesRemaining}m ${secondsRemaining}s restantes), intentando refrescar...`,
    ); */

    return authService.refreshToken().pipe(
      map(() => {
        // console.log('✅ Token refrescado exitosamente');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error al refrescar token:', error);
        // console.log('🔄 Redirigiendo a login con returnUrl:', state.url);

        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });

        return of(false);
      }),
    );
  }
  return true;
};
