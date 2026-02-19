import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
  filter,
  Observable,
  exhaustMap,
  timeout,
  retry
} from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../models/auth.model';
import { toast } from 'ngx-sonner';
import { AnimatedPetComponent } from '../../../../shared/animated-pet/animated-pet.component';

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AnimatedPetComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  // Referencia al componente de la mascota animada
  @ViewChild(AnimatedPetComponent) mascot!: AnimatedPetComponent;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;

  // Control de mascota
  isPasswordFocused = false;
  isEmailFocused = false;
  private isTogglingPassword = false;

  // Formulario reactivo
  loginForm!: FormGroup;

  // Estados del componente
  protected loading = false;
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

  /**
   * Inicialización del componente
   * Configura el formulario, obtiene la URL de retorno y verifica el estado de autenticación
   * También configura el stream de login usando RxJS para manejar todo el flujo de autenticación de forma reactiva
   * @returns void
   */
  ngOnInit(): void {
    this.initForm();
    this.getReturnUrl();
    this.checkAuthenticationStatus();
    this.setupLoginStream();
    this.loadRememberedEmail();
  }

  /**
   * Inicialización del formulario de login con validaciones
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Inicializar formulario con validaciones para email y password
   * @returns void
   */
  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  /**
   * Obtener URL de retorno desde query params o usar URL por defecto
   * Esto permite redirigir al usuario a la página que intentaba acceder antes de ser redirigido al login
   * @returns void
   */
  private getReturnUrl(): void {
    const urlParam = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = urlParam || '/app/dashboard';
  }

  /**
   * Verificar si el usuario ya está autenticado y redirigir si es así
   * Esto mejora la experiencia del usuario al evitar mostrar la página de login si ya están autenticados
   * @returns void
   */
  private checkAuthenticationStatus(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Configurar stream de login usando RxJS
   * Este método orquesta todo el flujo de login de forma reactiva
   * @returns void
   */
  private setupLoginStream(): void {
    this.loginSubject$
      .pipe(
        filter(() => this.validateForm()),
        tap(() => this.startLoading()),
        exhaustMap(() => this.performLogin()),
        filter((response) => this.isSuccessfulResponse(response)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => this.handleLoginSuccess(),
        error: (error) => {
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
   * Activa el estado de loading durante el proceso de login
   * Esto muestra un indicador de carga al usuario mientras se procesa la autenticación
   * @returns void
   */
  private startLoading(): void {
    this.loading = true;
    this.loginForm.disable();
  }

  /**
   * Desactiva el estado de loading después de completar el proceso de login
   * Esto oculta el indicador de carga una vez que se ha recibido la respuesta del backend, ya sea exitosa o con error
   * @returns void
   */
  private stopLoading(): void {
    this.loading = false;
    this.loginForm.enable();
  }

  /**
   * Limpia el mensaje de error antes de una nueva tentativa de login
   * Esto asegura que el usuario no vea mensajes de error antiguos al intentar iniciar sesión nuevamente
   * @returns void
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
   *
   * Incluye timeout de 30 segundos, hasta 2 reintentos automáticos,
   * manejo de errores y limpieza del estado de loading.
   *
   * @returns Observable con la respuesta del login (AuthResponse) si es exitoso,
   *          o null si ocurre algún error
   */
  private performLogin(): Observable<AuthResponse | null> {
    return this.authService.login(this.loginForm.value).pipe(
      timeout(30000),
      retry({
        count: 2,
        delay: 1000,
        resetOnSuccess: true,
      }),
      catchError((error) => this.handleLoginError(error)),
      finalize(() => this.stopLoading()),
    );
  }

  /**
   * Maneja el login exitoso
   * Redirige al usuario a la URL de retorno
   * @returns void
   */
  private handleLoginSuccess(): void {
    // Manejar "Recordarme"
    const rememberMe = this.loginForm.get('rememberMe')?.value;
    const email = this.loginForm.get('email')?.value;

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    // Mostrar notificación de éxito usando ngx-sonner
    toast.success('¡Bienvenido!', {
      description: 'Inicio de sesión exitoso',
      duration: 2000,
    });

    setTimeout(() => {
      this.router.navigateByUrl(this.returnUrl).then((navigated) => {
        if (navigated) {
        } else {
          console.error('❌ Fallo la navegación');
        }
      });
    }, 500);
  }

  /**
   * Getter para acceder a los controles del formulario desde el template de forma más limpia
   * Esto permite usar f['email'] en lugar de loginForm.controls['email'] en el HTML, mejorando la legibilidad
   * @returns los controles del formulario
   */
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Alternar visibilidad de la contraseña
   * Esto permite al usuario ver u ocultar la contraseña ingresada para mayor comodidad y seguridad
   * @returns void
   */
  togglePasswordVisibility(): void {
    this.isTogglingPassword = true;
    this.showPassword = !this.showPassword;

    setTimeout(() => {
      if (this.passwordInput?.nativeElement) {
        this.passwordInput.nativeElement.focus();
      }

      setTimeout(() => {
        this.isTogglingPassword = false;
      }, 50);
    }, 0);
  }

  /**
   * Enviar formulario
   * Emite un evento al stream de login para iniciar el proceso
   * @returns void
   */
  onSubmit(): void {
    this.loginSubject$.next();
  }

  /**
   * Reiniciar el formulario de login a su estado inicial
   * Limpia todos los campos, estados y errores
   * @returns void
   */
  resetForm(): void {
    this.loginForm.reset();
    this.submitted = false;
    this.clearError();

    toast.info('Formulario limpiado', {
      duration: 2000,
    });
  }
  /**
   * Cuando el input de email recibe focus o el usuario está escribiendo en él, la mascota mira hacia abajo
   * @returns void
   */
  onEmailFocus(): void {
    this.isPasswordFocused = false;
    this.isEmailFocused = true;
  }

  /**
   * Cuando el email pierde el focus y no se está escribiendo en él, la mascota vuelve a mirar al centro
   * Esto hace que la mascota reaccione de forma más natural a las interacciones del usuario con el campo de email
   * @returns void
   */
  onEmailBlur(): void {
    this.isEmailFocused = false;
    if (this.mascot) {
      this.mascot.resetEyePosition();
    }
  }

  /**
   * Cuando el área del password recibe focus o el usuario está escribiendo en él, la mascota mira hacia el centro (cubriéndose los ojos)
   * Esto hace que la mascota reaccione de forma más natural a las interacciones del usuario con el campo de password, añadiendo un toque de diversión y personalidad al formulario de login
   * @returns void
   */
  onPasswordAreaFocus(): void {
    this.isPasswordFocused = true;
    this.isEmailFocused = false;
  }

  /**
   * Cuando el área del password pierde focus y el foco no va a otro elemento dentro del mismo container, la mascota deja de mirar al centro
   * Esto asegura que la mascota solo reaccione cuando el usuario realmente deja de interactuar con el campo de password, manteniendo una experiencia de usuario coherente y agradable
   * @returns void
   */
  onPasswordAreaBlur(event: FocusEvent): void {
    // Si estamos en proceso de toggle, ignorar el blur
    if (this.isTogglingPassword) {
      return;
    }

    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;

    // Si el foco va a otro elemento dentro del mismo container
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }

    // Si el foco sale completamente
    this.isPasswordFocused = false;
  }

  /**
   * Cargar email recordado del localStorage si existe
   * Esto mejora UX al autocompletar el email en visitas futuras
   * @returns void
   */
  private loadRememberedEmail(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail');

    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        rememberMe: true,
      });
    }
  }

  /**
   * Manejar cambio en el checkbox "Recordarme"
   * Muestra feedback visual al usuario
   * @returns void
   */
  onRememberMeChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    if (isChecked) {
      toast.info('Te recordaremos', {
        description: 'Tu email se guardará para la próxima vez',
        duration: 2000,
      });
    }
  }
}
