import { RegisterRequest } from './../models/auth.model';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { AnimatedPetComponent } from '../../../../shared/animated-pet/animated-pet.component';
import { FormField, email, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { sanitizeReturnUrl } from '../../../../core/utils/url.utils';

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink, AnimatedPetComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @ViewChild(AnimatedPetComponent) mascot!: AnimatedPetComponent;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('confirmPasswordInput') confirmPasswordInput!: ElementRef<HTMLInputElement>;

  readonly isPasswordFocused = signal(false);
  readonly isNameFocused = signal(false);
  readonly isEmailFocused = signal(false);
  readonly currentFieldType = signal<'name' | 'email' | null>(null);

  private isTogglingPassword = false;
  private isTogglingConfirmPassword = false;

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  returnUrl = '/app/dashboard';

  readonly registerModel = signal({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  readonly registerForm = form(this.registerModel, (s) => {
    required(s.name, { message: 'El nombre es requerido' });
    minLength(s.name, 3, { message: 'Mínimo 3 caracteres' });
    validate(s.name, ({ value }) => {
      const v = value().trim();
      if (!v) return undefined;
      const words = v.split(/\s+/).filter((w: string) => w.length > 0);
      if (words.length < 2 || !words.every((w: string) => w.length >= 2)) {
        return { kind: 'invalidFullName', message: 'Ingresa tu nombre completo (nombre y apellido)' };
      }
      return undefined;
    });

    required(s.email, { message: 'El correo es requerido' });
    email(s.email, { message: 'Ingresa un correo válido' });

    required(s.password, { message: 'La contraseña es requerida' });
    minLength(s.password, 8, { message: 'Mínimo 8 caracteres' });
    validate(s.password, ({ value }) => {
      const v = value();
      if (!v) return undefined;
      if (!/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v)) {
        return { kind: 'weakPassword', message: 'Debe tener mayúsculas, minúsculas y números' };
      }
      return undefined;
    });

    required(s.confirmPassword, { message: 'Confirma tu contraseña' });
    validate(s.confirmPassword, ({ value, valueOf }) => {
      const v = value();
      if (!v) return undefined;
      if (v !== valueOf(s.password)) {
        return { kind: 'passwordMismatch', message: 'Las contraseñas no coinciden' };
      }
      return undefined;
    });
  });

  get f() {
    return {
      name: this.registerForm.name,
      email: this.registerForm.email,
      password: this.registerForm.password,
      confirmPassword: this.registerForm.confirmPassword,
    };
  }

  ngOnInit(): void {
    this.getReturnUrl();
    this.checkAuthenticationStatus();
  }

  private getReturnUrl(): void {
    this.returnUrl = sanitizeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
  }

  private checkAuthenticationStatus(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set('');
    submit(this.registerForm, async () => {
      this.loading.set(true);
      const model = this.registerModel();
      const registerData: RegisterRequest = {
        name: model.name,
        email: model.email,
        password: model.password,
      };
      try {
        await firstValueFrom(this.authService.register(registerData));
        toast.success('¡Cuenta creada!', { description: 'Redirigiendo al dashboard...', duration: 2000 });
        setTimeout(() => this.router.navigate([this.returnUrl]), 1000);
      } catch (err: unknown) {
        const anyErr = err as { error?: { message?: string }; message?: string };
        const msg = anyErr?.error?.message || 'Error al crear la cuenta. Por favor, inténtalo de nuevo.';
        this.error.set(msg);
        toast.error('Error de registro', { description: msg, duration: 4000 });
      } finally {
        this.loading.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.isTogglingPassword = true;
    this.showPassword.update((v) => !v);
    setTimeout(() => {
      if (this.passwordInput?.nativeElement) this.passwordInput.nativeElement.focus();
      setTimeout(() => { this.isTogglingPassword = false; }, 50);
    }, 0);
  }

  toggleConfirmPasswordVisibility(): void {
    this.isTogglingConfirmPassword = true;
    this.showConfirmPassword.update((v) => !v);
    setTimeout(() => {
      if (this.confirmPasswordInput?.nativeElement) this.confirmPasswordInput.nativeElement.focus();
      setTimeout(() => { this.isTogglingConfirmPassword = false; }, 50);
    }, 0);
  }

  resetForm(): void {
    this.registerModel.set({ name: '', email: '', password: '', confirmPassword: '' });
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
