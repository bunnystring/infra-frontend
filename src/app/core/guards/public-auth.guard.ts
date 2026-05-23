import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {

    // Verificar si el token no ha expirado
    if (!authService.isTokenExpired()) {

      // Redirigir al dashboard si el usuario ya está autenticado y el token es válido
      router.navigateByUrl('/app/dashboard', { replaceUrl: true });
      return false;
    }

    // Token expirado, limpiar sesión y permitir acceso
    authService.logout();
  }

  // No autenticado o token expirado - permitir acceso
  return true;
};
