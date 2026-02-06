import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Servicio para realizar llamadas HTTP al backend
 * Proporciona métodos genéricos para GET, POST, PUT, DELETE, etc.
 * @since 2026-02-05
 * @author Bunnystring
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Construye la URL completa
   */
  private buildUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  /**
   * GET request
   * @param endpoint Endpoint relativo)
   * @param params Query parameters (opcional)
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), { params });
  }

  /**
   * POST request (JSON)
   * @param endpoint Endpoint relativo
   * @param body Cuerpo de la petición
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  /**
   * PUT request
   * @param endpoint Endpoint relativo
   * @param body Cuerpo de la petición
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  /**
   * PATCH request
   * @param endpoint Endpoint relativo
   * @param body Cuerpo de la petición
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body);
  }

  /**
   * DELETE request
   * @param endpoint Endpoint relativo
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }

/**
   * POST FormData (para archivos Excel, imágenes, etc.)
   * @param endpoint Endpoint relativo
   * @param formData FormData con archivos
   */
  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), formData);
  }

  /**
   * PUT FormData (para actualizar con archivos)
   * @param endpoint Endpoint relativo
   * @param formData FormData con archivos
   */
  putFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), formData);
  }

  /**
   * POST con query params y body
   * Útil para endpoints que requieren ambos
   */
  postWithParams<T>(endpoint: string, body: any, params: HttpParams): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body, { params });
  }

  /**
   * GET que devuelve Blob (para descargas de archivos)
   * @param endpoint Endpoint relativo
   */
  getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(this.buildUrl(endpoint), {
      responseType: 'blob'
    });
  }

   /**
   * POST que devuelve Blob (para generar y descargar reportes)
   * @param endpoint Endpoint relativo
   * @param body Cuerpo de la petición
   */
  postBlob(endpoint: string, body: any): Observable<Blob> {
    return this.http.post(this.buildUrl(endpoint), body, {
      responseType: 'blob'
    });
  }

  /**
   * Construye HttpParams desde un objeto
   * @param params Objeto con parámetros
   * @returns HttpParams
   */
  buildParams(params: { [key: string]: any }): HttpParams {
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

  /**
   * Obtiene la URL base del API
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

}
