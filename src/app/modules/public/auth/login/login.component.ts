import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import {
  Subject,
  takeUntil,
  finalize,
  catchError,
  of,
  tap,
  switchMap,
  filter,
  Observable,
} from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../models/auth.model';
import { toast } from 'ngx-sonner';

/**
 * Componente de Login
 * Maneja la autenticación de usuarios usando formularios reactivos y RxJS
 *
 * @author Bunnystring
 * @since 2026-02-06
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  // Formulario reactivo
  loginForm!: FormGroup;

  // Estados del componente
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;

  // URL de retorno después del login
  returnUrl = '/app/dashboard';

  // Subjects para manejo de observables
  private readonly destroy$ = new Subject<void>();
  private readonly loginSubject$ = new Subject<void>();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getReturnUrl();
    this.checkAuthenticationStatus();
    this.setupLoginStream();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Inicializar formulario con validaciones
   */
  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Obtener URL de retorno desde query params
   */
  private getReturnUrl(): void {
    const urlParam = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = urlParam || '/app/dashboard';
    console.log('📍 Return URL configurada:', this.returnUrl);
  }

  /**
   * Verificar si el usuario ya está autenticado y redirigir
   */
  private checkAuthenticationStatus(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Configurar stream de login usando RxJS
   * Este método orquesta todo el flujo de login de forma reactiva
   */
  private setupLoginStream(): void {
    this.loginSubject$
      .pipe(
        filter(() => this.validateForm()),
        tap(() => this.startLoading()),
        switchMap(() => this.performLogin()),
        filter((response) => this.isSuccessfulResponse(response)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => this.handleLoginSuccess(),
        error: (error) => {
          // Este error no debería ocurrir ya que catchError lo maneja
          console.error('Error inesperado en el stream:', error);
          this.stopLoading();
        },
      });
  }

  /**
   * Valida el formulario y actualiza el estado
   * @returns true si el formulario es válido
   */
  private validateForm(): boolean {
    this.submitted = true;
    this.clearError();
    return this.loginForm.valid;
  }

  /**
   * Verifica si la respuesta del login fue exitosa
   * @param response Respuesta del login
   * @returns true si la respuesta no es null
   */
  private isSuccessfulResponse(response: AuthResponse | null): boolean {
    return response !== null;
  }

  /**
   * Activa el estado de loading
   */
  private startLoading(): void {
    this.loading = true;
  }

  /**
   * Desactiva el estado de loading
   */
  private stopLoading(): void {
    this.loading = false;
  }

  /**
   * Limpia el mensaje de error
   */
  private clearError(): void {
    this.error = '';
  }

  /**
   * Maneja los errores del login
   * @param error Error recibido del backend
   * @returns Observable con null para continuar el flujo
   */
  private handleLoginError(error: any): Observable<null> {
    console.error('Error en login:', error);

    // Extraer mensaje de error del backend
    this.error =
      error?.error?.message ||
      'Error de autenticación. Por favor, inténtalo de nuevo.';

    // Mostrar notificación de error usando ngx-sonner
    toast.error('Error de autenticación', {
      description: this.error,
      duration: 4000,
    });

    return of(null);
  }

  /**
   * Realiza la petición de login al backend
   * @returns Observable con la respuesta del login o null si hay error
   */
  private performLogin(): Observable<AuthResponse | null> {
    return this.authService.login(this.loginForm.value).pipe(
      catchError((error) => this.handleLoginError(error)),
      finalize(() => this.stopLoading()),
    );
  }

  /**
   * Maneja el login exitoso
   * Redirige al usuario a la URL de retorno
   */
  private handleLoginSuccess(): void {
    console.log('Login exitoso - Redirigiendo a:', this.returnUrl);

    toast.success('¡Bienvenido!', {
      description: 'Inicio de sesión exitoso',
      duration: 2000,
    });

    setTimeout(() => {
      this.router.navigateByUrl(this.returnUrl).then((navigated) => {
        if (navigated) {
          console.log('✅ Navegación exitosa');
        } else {
          console.error('❌ Fallo la navegación');
        }
      });
    }, 500);
  }

  /**
   * Getter para acceder a los controles del formulario desde el template
   */
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Alternar visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Enviar formulario
   * Emite un evento al stream de login para iniciar el proceso
   */
  onSubmit(): void {
    this.loginSubject$.next();
  }

  /**
   * Reiniciar el formulario
   */
  resetForm(): void {
    this.loginForm.reset();
    this.submitted = false;
    this.clearError();

    toast.info('Formulario limpiado', {
      duration: 2000,
    });
  }
}
