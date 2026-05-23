import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Interceptor para agregar el token de autenticación a las peticiones HTTP
 *
 * @since 2026-02-05
 * @author Bunnystring
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const context = isPlatformServer(platformId) ? '[SSR]' : '[BROWSER]';

  console.log(`${context} HTTP ${req.method} → ${req.url}`);

  // Lista de endpoints que no requieren token
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];

  // Verificar si la URL de la solicitud coincide con algún endpoint público
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint),
  );

  // Si es un endpoint público, no agregar el token
  if (isPublicEndpoint) {
    return next(req);
  }

  // Agregar token si existe
  const token = authService.getToken();
  let clonedReq = req;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Ejecutar la petición y manejar errores
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        authService.getRefreshToken()
      ) {
        // Intentar refrescar el token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Clonar la petición original con el nuevo token
            const newToken = response.accessToken;
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            // Reintentar la petición original con el nuevo token
            return next(retryReq);
          }),
          catchError((refreshError) => {
            console.error('❌ Fallo al refrescar token:', refreshError);
            authService.logout();
            // EMPTY evita que el error llegue a errorInterceptor, que también
            // navega a /auth/login en 401 — previniendo doble navegación.
            return EMPTY;
          }),
        );
      }

      // Para otros errores, simplemente propagarlos
      if (error.status !== 401) {
        console.error(`❌ Error ${error.status} en petición:`, req.url);
      }

      return throwError(() => error);
    }),
  );
};
