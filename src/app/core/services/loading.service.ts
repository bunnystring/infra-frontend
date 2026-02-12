import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Servicio para gestionar el estado de carga global de la aplicación.
 * Permite mostrar un indicador de carga cuando hay solicitudes en curso y ocultarlo cuando no las hay.
 * Implementa un sistema de conteo para manejar múltiples solicitudes simultáneas y asegura que el indicador se muestre durante un tiempo mínimo para evitar parpadeos.
 *
 * @since 2026-02-11
 * @author BunnyString
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {

  // variables para controlar el estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;
  private loadingStartTime: number | null = null;
  private readonly DEBOUNCE_TIME = 200;
  private readonly MIN_DISPLAY_TIME = 600;

  // Observable para que los componentes se suscriban al estado de carga
  public loading$ = this.loadingSubject
    .asObservable()
    .pipe(debounceTime(this.DEBOUNCE_TIME), distinctUntilChanged());

  /**
   * Muestra el indicador de carga
   * Si ya hay una solicitud en curso, simplemente incrementa el contador.
   * @returns void
   */
  show(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingStartTime = Date.now();
      this.loadingSubject.next(true);
    }
  }

  /**
   * Oculta el indicador de carga
   * Solo oculta el indicador cuando el contador de solicitudes llega a cero.
   * Si el indicador ha estado visible por menos del tiempo mínimo, se asegura de que se muestre durante al menos ese tiempo.
   * @returns void
   */
  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;

      if (this.loadingStartTime) {
        const elapsed = Date.now() - this.loadingStartTime;
        const remaining = Math.max(0, this.MIN_DISPLAY_TIME - elapsed);

        setTimeout(() => {
          this.loadingSubject.next(false);
          this.loadingStartTime = null;
        }, remaining);
      } else {
        this.loadingSubject.next(false);
      }
    }
  }
}
