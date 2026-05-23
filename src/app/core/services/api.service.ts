import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private buildUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), { params });
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }

postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), formData);
  }

  putFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), formData);
  }

  postWithParams<T>(endpoint: string, body: unknown, params: HttpParams): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body, { params });
  }

  getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(this.buildUrl(endpoint), {
      responseType: 'blob'
    });
  }

   postBlob(endpoint: string, body: unknown): Observable<Blob> {
    return this.http.post(this.buildUrl(endpoint), body, {
      responseType: 'blob'
    });
  }

  buildParams(params: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const value = params[key];

      // Incluir solo valores válidos (no null, undefined, ni string vacío)
      if (value !== null && value !== undefined && value !== '') {
        // Si es un array, agregar múltiples valores con el mismo key
        if (Array.isArray(value)) {
          value.forEach(item => {
            httpParams = httpParams.append(key, item.toString());
          });
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return httpParams;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

}
