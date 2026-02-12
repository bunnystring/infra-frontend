import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor para mostrar un indicador de carga global durante las solicitudes HTTP.
 * Utiliza el LoadingService para gestionar el estado de carga y asegurar que el indicador se muestre durante un tiempo mínimo para evitar parpadeos.
 * @param req La solicitud HTTP entrante.
 * @param next El siguiente manejador en la cadena de interceptores.
 * @returns Un observable que representa la respuesta HTTP.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el servicio de carga para mostrar y ocultar el indicador de carga
  const loadingService = inject(LoadingService);

  // Mostramos el indicador de carga al iniciar la solicitud
  loadingService.show();

  // Continuamos con la solicitud y nos aseguramos de ocultar el indicador de carga cuando la solicitud finalice, ya sea con éxito o con error
  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
