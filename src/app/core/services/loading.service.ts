import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly _loading = signal(false);

  readonly loading = this._loading.asReadonly();

  readonly loading$ = toObservable(this._loading).pipe(
    debounceTime(200),
    distinctUntilChanged(),
  );

  private requestCount = 0;
  private loadingStartTime: number | null = null;
  private readonly MIN_DISPLAY_TIME = 600;

  show(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingStartTime = Date.now();
      this._loading.set(true);
    }
  }

  hide(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      if (this.loadingStartTime) {
        const elapsed = Date.now() - this.loadingStartTime;
        const remaining = Math.max(0, this.MIN_DISPLAY_TIME - elapsed);
        setTimeout(() => {
          this._loading.set(false);
          this.loadingStartTime = null;
        }, remaining);
      } else {
        this._loading.set(false);
      }
    }
  }
}
