import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, tap, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../../modules/public/auth/models/auth.model';
import { User } from '../../modules/public/auth/models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  private readonly _currentUser = signal<User | null>(this.getUserFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly currentUser$ = toObservable(this._currentUser);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(`/auth/login`, credentials).pipe(
      tap((response) => {
        this.saveAuthData(response);
        this._currentUser.set(response.user);
      }),
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(`/auth/register`, userData).pipe(
      tap((response) => {
        this.saveAuthData(response);
        this._currentUser.set(response.user);
      }),
    );
  }

  logout(): void {
    this.clearAuthData();
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.REFRESH_TOKEN_KEY) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this._currentUser();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  isTokenExpiringSoon(minutes: number = 5): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const threshold = minutes * 60 * 1000;
      return Date.now() >= payload.exp * 1000 - threshold;
    } catch {
      return false;
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService
      .post<AuthResponse>(`/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          this._currentUser.set(response.user);
        }),
        catchError((error) => {
          this.clearAuthData();
          this._currentUser.set(null);
          return throwError(() => error);
        }),
      );
  }

  getTokenExpirationTime(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const timeRemaining = payload.exp * 1000 - Date.now();
      return timeRemaining > 0 ? timeRemaining : 0;
    } catch {
      return null;
    }
  }

  private saveAuthData(response: AuthResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  private clearAuthData(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private getUserFromStorage(): User | null {
    if (!this.isBrowser) return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? (JSON.parse(userStr) as User) : null;
  }
}
