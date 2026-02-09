import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

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

 console.log('🛡️ AuthGuard activado para:', state.url);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {
    console.log('✅ AuthGuard: Usuario autenticado');

    // Verificar si el token no ha expirado
    if (!authService.isTokenExpired()) {
      console.log('✅ AuthGuard: Token válido, acceso permitido');
      return true;
    }

    console.warn('⚠️ AuthGuard: Token expirado, redirigiendo al login');
    // Limpiar sesión expirada
    authService.logout();
  } else {
    console.warn('❌ AuthGuard: Usuario NO autenticado');
  }

  // No autenticado o token expirado - redirigir al login
  console.log('🔄 Redirigiendo a login con returnUrl:', state.url);
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};
