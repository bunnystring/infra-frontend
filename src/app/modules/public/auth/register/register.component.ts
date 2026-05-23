import { RegisterRequest } from './../models/auth.model';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { AnimatedPetComponent } from '../../../../shared/animated-pet/animated-pet.component';
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
} from '../../../../core/utils/form-validators.utils';
import {
  Subject,
  finalize,
  catchError,
  of,
  tap,
  switchMap,
  filter,
  Observable,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthResponse } from '../models/auth.model';
import { sanitizeReturnUrl } from '../../../../core/utils/url.utils';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AnimatedPetComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(AnimatedPetComponent) mascot!: AnimatedPetComponent;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('confirmPasswordInput') confirmPasswordInput!: ElementRef<HTMLInputElement>;

  readonly isPasswordFocused = signal(false);
  readonly isNameFocused = signal(false);
  readonly isEmailFocused = signal(false);
  readonly currentFieldType = signal<'name' | 'email' | null>(null);

  private isTogglingPassword = false;
  private isTogglingConfirmPassword = false;

  registerForm!: FormGroup;

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  returnUrl = '/app/dashboard';

  private readonly registerSubject$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.getReturnUrl();
    this.checkAuthenticationStatus();
    this.setupRegisterStream();
  }

  initForm(): void {
    this.registerForm = this.formBuilder.group(
      {
        name: ['', [Validators.required, Validators.minLength(3), fullNameValidator()]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator('password', 'confirmPassword') },
    );
  }

  private setupRegisterStream(): void {
    this.registerSubject$
      .pipe(
        filter(() => this.validateForm()),
        tap(() => this.loading.set(true)),
        switchMap(() => this.performRegister()),
        filter((response) => response !== null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.handleRegisterSuccess(),
        error: (err) => {
          this.handleRegisterError(err);
          this.loading.set(false);
        },
      });
  }

  private validateForm(): boolean {
    this.submitted.set(true);
    this.error.set('');
    if (this.registerForm.invalid) {
      toast.error('Formulario inválido', {
        description: 'Por favor completa todos los campos correctamente',
        duration: 3000,
      });
      return false;
    }
    return true;
  }

  private getReturnUrl(): void {
    this.returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
  }

  private checkAuthenticationStatus(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  private handleRegisterSuccess(): void {
    toast.success('¡Cuenta creada!', {
      description: 'Redirigiendo al dashboard...',
      duration: 2000,
    });
    setTimeout(() => {
      this.router.navigate([this.returnUrl]);
    }, 1000);
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.registerSubject$.next();
  }

  togglePasswordVisibility(): void {
    this.isTogglingPassword = true;
    this.showPassword.update((v) => !v);
    setTimeout(() => {
      if (this.passwordInput?.nativeElement) {
        this.passwordInput.nativeElement.focus();
      }
      setTimeout(() => {
        this.isTogglingPassword = false;
      }, 50);
    }, 0);
  }

  toggleConfirmPasswordVisibility(): void {
    this.isTogglingConfirmPassword = true;
    this.showConfirmPassword.update((v) => !v);
    setTimeout(() => {
      if (this.confirmPasswordInput?.nativeElement) {
        this.confirmPasswordInput.nativeElement.focus();
      }
      setTimeout(() => {
        this.isTogglingConfirmPassword = false;
      }, 50);
    }, 0);
  }

  private performRegister(): Observable<AuthResponse | null> {
    const registerData: RegisterRequest = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };
    return this.authService.register(registerData).pipe(
      catchError((err) => this.handleRegisterError(err)),
      finalize(() => this.loading.set(false)),
    );
  }

  private handleRegisterError(err: any): Observable<null> {
    const msg = err?.error?.message || 'Error al crear la cuenta. Por favor, inténtalo de nuevo.';
    this.error.set(msg);
    toast.error('Error de registro', { description: msg, duration: 4000 });
    return of(null);
  }

  resetForm(): void {
    this.registerForm.reset();
    this.submitted.set(false);
    this.error.set('');
    this.isNameFocused.set(false);
    this.isEmailFocused.set(false);
    this.isPasswordFocused.set(false);
    toast.info('Formulario limpiado', { duration: 2000 });
  }

  onNameFocus(): void {
    this.isNameFocused.set(true);
    this.isEmailFocused.set(false);
    this.isPasswordFocused.set(false);
    this.currentFieldType.set('name');
  }

  onNameBlur(): void {
    this.isNameFocused.set(false);
    this.currentFieldType.set(null);
    if (this.mascot) this.mascot.resetEyePosition();
  }

  onEmailFocus(): void {
    this.isEmailFocused.set(true);
    this.isNameFocused.set(false);
    this.isPasswordFocused.set(false);
    this.currentFieldType.set('email');
  }

  onEmailBlur(): void {
    this.isEmailFocused.set(false);
    this.currentFieldType.set(null);
    if (this.mascot) this.mascot.resetEyePosition();
  }

  onPasswordAreaFocus(): void {
    this.isPasswordFocused.set(true);
    this.isNameFocused.set(false);
    this.isEmailFocused.set(false);
    this.currentFieldType.set(null);
  }

  onPasswordAreaBlur(event: FocusEvent): void {
    if (this.isTogglingPassword || this.isTogglingConfirmPassword) return;
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (relatedTarget && currentTarget.contains(relatedTarget)) return;
    this.isPasswordFocused.set(false);
  }
}
