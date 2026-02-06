import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
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

  // BehaviorSubject para mantener el estado del usuario autenticado
  private currentUserSubject = new BehaviorSubject<any>(
    this.getUserFromStorage(),
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Inicia sesión con las credenciales proporcionadas
   * @param credentials
   * @returns
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService
      .post<AuthResponse>(`/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
        }),
      );
  }

  /**
   * Registra un nuevo usuario
   * @param userData
   * @returns
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
        }),
      );
  }

  /**
   * Refresca el token de autenticación
   * @returns
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.apiService
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
        }),
      );
  }

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtiene el token de autenticación almacenado
   * @returns
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
   * @returns
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtiene el usuario actualmente autenticado
   * @returns
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el token de autenticación ha expirado
   * @returns
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
   * Guarda los datos de autenticación en el almacenamiento local
   * @param response
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
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Obtiene el usuario almacenado en el almacenamiento local
   * @returns
   */
  private getUserFromStorage(): any {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
}
