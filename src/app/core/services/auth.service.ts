import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../../modules/public/auth/models/auth.model';
import { ApiService } from './api.service';

/**
 * Servicio para gestionar autenticación y autorización
 *
 * @since 2026-02-05
 * @author Bunnystring
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyeecion de servicios
  private apiService = inject(ApiService);
  private router = inject(Router);

  // contiene las claves para almacenar los datos de autenticación en localStorage
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  /**
   * BehaviorSubject para mantener el estado del usuario autenticado
   * Inicializa con el usuario almacenado en localStorage (si existe)
   * @returns BehaviorSubject del usuario autenticado
   */
  private currentUserSubject = new BehaviorSubject<any>(
    this.getUserFromStorage(),
  );

  /**
   * Observable para suscribirse a los cambios del usuario autenticado
   * Permite a otros componentes reaccionar a cambios en el estado de autenticación
   * @returns Observable del usuario autenticado
   */
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Inicia sesión con las credenciales proporcionadas
   * @param credentials
   * @returns Observable<AuthResponse>
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(`/auth/login`, credentials).pipe(
      tap((response) => {
        this.saveAuthData(response);
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  /**
   * Registra un nuevo usuario
   * @param userData
   * @returns Observable<AuthResponse>
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(`/auth/register`, userData).pipe(
      tap((response) => {
        this.saveAuthData(response);
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  /**
   * Cierra la sesión del usuario actual
   * @returns void
   */
  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtiene el token de autenticación almacenado
   * @returns Token de autenticación o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el token de refresco almacenado
   * @returns
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si el usuario tiene un token válido, false en caso contrario
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtiene el usuario actualmente autenticado
   * @returns Usuario autenticado o null si no hay ninguno
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el token de autenticación ha expirado
   * @returns true si el token ha expirado o no existe, false si el token es válido
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() >= expiry;
    } catch (error) {
      return true;
    }
  }

  /**
   * Verifica si el token está próximo a expirar (dentro de los próximos 5 minutos)
   * Útil para refrescar el token de forma proactiva
   * @returns true si el token expira en menos de 5 minutos
   */
  isTokenExpiringSoon(minutes: number = 5): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const threshold = minutes * 60 * 1000;
      return Date.now() >= expiry - threshold;
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return false;
    }
  }

  /**
   * Guarda los datos de autenticación en el almacenamiento local
   * @param response
   * @returns void
   */
  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);

    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  /**
   * Limpia los datos de autenticación del almacenamiento local
   * @returns void
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Obtiene el usuario almacenado en el almacenamiento local
   * @returns Usuario almacenado o null si no existe
   */
  private getUserFromStorage(): any {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Refresca el token de autenticación
   * @returns Observable<AuthResponse>
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      console.error('❌ No hay refresh token disponible');
      return throwError(() => new Error('No refresh token available'));
    }

    // console.log('🔄 Solicitando nuevo token...');

    return this.apiService
      .post<AuthResponse>(`/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          // console.log('✅ Refresh token exitoso');
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
        }),
        catchError((error) => {
          console.error('❌ Error en refresh token:', error);
          // Si falla el refresh, limpiar datos y hacer logout
          this.clearAuthData();
          this.currentUserSubject.next(null);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Obtiene el tiempo restante hasta que expire el token
   * Útil para mostrar información al usuario o para debugging
   * @returns Tiempo en milisegundos o null si no hay token
   */
  getTokenExpirationTime(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const timeRemaining = expiry - Date.now();
      return timeRemaining > 0 ? timeRemaining : 0;
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return null;
    }
  }
}
