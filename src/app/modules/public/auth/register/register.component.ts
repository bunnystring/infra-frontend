import { RegisterRequest } from './../models/auth.model';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { AnimatedPetComponent } from '../../../../shared/animated-pet/animated-pet.component';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../../../core/services/auth.service';
import {
  passwordMatchValidator,
  strongPasswordValidator,
  fullNameValidator,
  minAgeValidator,
  phoneValidator,
} from '../../../../core/utils/form-validators.utils';
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
import { AuthResponse } from '../models/auth.model';

/**
 * Componente de Registro
 * Maneja el registro de nuevos usuarios usando formularios reactivos con validaciones avanzadas
 *
 * @author Bunnystring
 * @since 2026-02-10
 */
@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AnimatedPetComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  // Refencias a elementos del DOM
  @ViewChild(AnimatedPetComponent) mascot!: AnimatedPetComponent;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('confirmPasswordInput')
  confirmPasswordInput!: ElementRef<HTMLInputElement>;

  // control de mascota animada
  isPasswordFocused = false;
  isNameFocused = false;
  isEmailFocused = false;
  currentFieldType: 'name' | 'email' | null = null;
  private isTogglingPassword = false;
  private isTogglingConfirmPassword = false;

  // Formulario de registro reactivo
  registerForm!: FormGroup;

  // Estados del componente
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;

  // URL de retorno después del login
  returnUrl = '/app/dashboard';

  // Subject para manejar la destrucción del componente y evitar memory leaks
  private readonly destroy$ = new Subject<void>();
  private readonly registerSubject$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  /**
   * Inicialización del componente
   * Configura el formulario reactivo con validaciones personalizadas
   * @returns void
   */
  ngOnInit(): void {
    this.initForm();
    this.getReturnUrl();
    this.checkAuthenticationStatus();
    this.setupRegisterStream();
  }

  /**
   * Limpieza del componente al destruirse
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario de registro con validaciones avanzadas
   * Además, se agrega un validador a nivel de formulario para asegurar que password y confirmPassword coincidan
   * @returns void
   */
  initForm(): void {
    this.registerForm = this.formBuilder.group(
      {
        name: [
          '',
          [Validators.required, Validators.minLength(3), fullNameValidator()],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            strongPasswordValidator(),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator('password', 'confirmPassword') },
    );
  }

  /**
   * Configurar stream de registro usando RxJS
   * Este método orquesta todo el flujo de registro de forma reactiva
   * @returns void
   */
  private setupRegisterStream(): void {
    this.registerSubject$
      .pipe(
        filter(() => this.validateForm()),
        tap(() => this.startLoading()),
        switchMap(() => this.performRegister()),
        filter((response) => this.isSuccessfulResponse(response)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => this.handleRegisterSuccess(),
        error: (error) => {
          this.handleRegisterError(error);
          this.stopLoading();
        },
      });
  }

  /**
   * Valida el formulario antes de enviarlo
   * Verifica que todos los campos cumplan con las validaciones requeridas
   * @returns true si el formulario es válido
   */
  private validateForm(): boolean {
    this.submitted = true;
    this.clearError();

    if (this.registerForm.invalid) {
      toast.error('Formulario inválido', {
        description: 'Por favor completa todos los campos correctamente',
        duration: 3000,
      });
      return false;
    }

    return true;
  }

  /**
   * Verifica si la respuesta del registro fue exitosa
   * @param response Respuesta del registro
   * @returns true si la respuesta no es null
   */
  private isSuccessfulResponse(response: AuthResponse | null): boolean {
    return response !== null;
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
   * Esto mejora la experiencia del usuario al evitar mostrar la página de register si ya están autenticados
   * @returns void
   */
  private checkAuthenticationStatus(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Activa el estado de loading durante el proceso de registro
   * @returns void
   */
  private startLoading(): void {
    this.loading = true;
  }

  /**
   * Desactiva el estado de loading después de completar el proceso
   * @returns void
   */
  private stopLoading(): void {
    this.loading = false;
  }

  /**
   * Limpia el mensaje de error
   * @returns void
   */
  private clearError(): void {
    this.error = '';
  }

  /**
   * Maneja el registro exitoso
   * Muestra notificación y redirige al login
   * @returns void
   */
  private handleRegisterSuccess(): void {
    toast.success('¡Cuenta creada!', {
      description: 'Redirigiendo al login...',
      duration: 2000,
    });

    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 1000);
  }

  /**
   * Getter para acceder a los controles del formulario desde el template
   * @returns los controles del formulario
   */
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Enviar formulario de registro
   * Emite un evento al stream de registro para iniciar el proceso
   * @returns void
   */
  onSubmit(): void {
    this.registerSubject$.next();
  }

  /**
   * Alternar visibilidad de la contraseña
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
   * Alternar visibilidad de la confirmación de contraseña
   * @returns void
   */
  toggleConfirmPasswordVisibility(): void {
    this.isTogglingConfirmPassword = true;
    this.showConfirmPassword = !this.showConfirmPassword;

    setTimeout(() => {
      if (this.confirmPasswordInput?.nativeElement) {
        this.confirmPasswordInput.nativeElement.focus();
      }

      setTimeout(() => {
        this.isTogglingConfirmPassword = false;
      }, 50);
    }, 0);
  }

  /**
   * Realiza la petición de registro al backend
   * @returns Observable con la respuesta del registro o null si hay error
   */
  private performRegister(): Observable<AuthResponse | null> {
    // Construir el objeto de registro a partir de los valores del formulario
    const registerData: RegisterRequest = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    return this.authService.register(registerData).pipe(
      catchError((error) => this.handleRegisterError(error)),
      finalize(() => this.stopLoading()),
    );
  }

  /**
   * Maneja los errores del registro
   * @param error Error recibido del backend
   * @returns Observable con null para continuar el flujo
   */
  private handleRegisterError(error: any): Observable<null> {
    console.error('Error en registro:', error);

    // Extraer mensaje de error del backend
    this.error =
      error?.error?.message ||
      'Error al crear la cuenta. Por favor, inténtalo de nuevo.';

    // Mostrar notificación de error usando ngx-sonner
    toast.error('Error de registro', {
      description: this.error,
      duration: 4000,
    });

    return of(null);
  }

  /**
   * Reiniciar el formulario a su estado inicial
   * @returns void
   */
  resetForm(): void {
    this.registerForm.reset();
    this.submitted = false;
    this.clearError();
    this.isNameFocused = false;
    this.isEmailFocused = false;
    this.isPasswordFocused = false;

    toast.info('Formulario limpiado', {
      duration: 2000,
    });
  }

  /**
   * Cuando el input de nombre recibe focus, la mascota mira hacia abajo
   * @returns void
   */
  onNameFocus(): void {
    this.isNameFocused = true;
    this.isEmailFocused = false;
    this.isPasswordFocused = false;
    this.currentFieldType = 'name';
  }

  /**
   * Cuando el nombre pierde el focus, la mascota vuelve al centro
   * @returns void
   */
  onNameBlur(): void {
    this.isNameFocused = false;
    this.currentFieldType = null;
    if (this.mascot) {
      this.mascot.resetEyePosition();
    }
  }

  /**
   * Cuando el input de email recibe focus, la mascota mira hacia abajo
   * @returns void
   */
  onEmailFocus(): void {
    this.isEmailFocused = true;
    this.isNameFocused = false;
    this.isPasswordFocused = false;
    this.currentFieldType = 'email';
  }

  /**
   * Cuando el email pierde el focus, la mascota vuelve al centro
   * @returns void
   */
  onEmailBlur(): void {
    this.isEmailFocused = false;
    this.currentFieldType = null;
    if (this.mascot) {
      this.mascot.resetEyePosition();
    }
  }

  /**
   * Cuando el área de password recibe focus, la mascota se tapa los ojos
   * Aplica tanto para password como confirmPassword
   * @returns void
   */
  onPasswordAreaFocus(): void {
    this.isPasswordFocused = true;
    this.isNameFocused = false;
    this.isEmailFocused = false;
    this.currentFieldType = null;
  }

  /**
   * Cuando el área de password pierde focus, la mascota destapa los ojos
   * Solo si el foco sale completamente del área de contraseñas
   * @returns void
   */
  onPasswordAreaBlur(event: FocusEvent): void {
    // Si estamos en proceso de toggle, ignorar el blur
    if (this.isTogglingPassword || this.isTogglingConfirmPassword) {
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
}
