import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  form,
  FormField,
  submit,
  required,
  email,
  minLength,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../../../core/services/auth.service';
import { AnimatedPetComponent } from '../../../../shared/animated-pet/animated-pet.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormField, RouterLink, AnimatedPetComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  @ViewChild(AnimatedPetComponent) mascot!: AnimatedPetComponent;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly returnUrl =
    this.route.snapshot.queryParams['returnUrl'] ?? '/app/dashboard';

  isPasswordFocused = false;
  isEmailFocused = false;
  private isTogglingPassword = false;

  readonly showPassword = signal(false);
  readonly loading = signal(false);

  readonly loginModel = signal({
    email: this.isBrowser ? (localStorage.getItem('rememberedEmail') ?? '') : '',
    password: '',
    rememberMe: this.isBrowser && !!localStorage.getItem('rememberedEmail'),
  });

  readonly loginForm = form(this.loginModel, (s) => {
    required(s.email, { message: 'El correo es requerido' });
    email(s.email, { message: 'Ingresa un correo válido' });
    required(s.password, { message: 'La contraseña es requerida' });
    minLength(s.password, 6, { message: 'Mínimo 6 caracteres' });
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loading()) return;
    submit(this.loginForm, async () => {
      this.loading.set(true);
      try {
        const { email, password } = this.loginModel();
        await firstValueFrom(this.authService.login({ email, password }));
        this.saveRememberMe();
        toast.success('¡Bienvenido!', {
          description: 'Inicio de sesión exitoso',
          duration: 2000,
        });
        this.router.navigateByUrl(this.returnUrl);
      } catch (error: any) {
        const message =
          error?.error?.message ||
          'Error de autenticación. Por favor, inténtalo de nuevo.';
        toast.error('Error de autenticación', { description: message, duration: 4000 });
      } finally {
        this.loading.set(false);
      }
    });
  }

  resetForm(): void {
    this.loginModel.update((m) => ({ ...m, email: '', password: '', rememberMe: false }));
    this.loginForm().reset();
    toast.info('Formulario limpiado', { duration: 2000 });
  }

  togglePasswordVisibility(): void {
    this.isTogglingPassword = true;
    this.showPassword.update((v) => !v);
    setTimeout(() => {
      this.passwordInput?.nativeElement.focus();
      this.isTogglingPassword = false;
    }, 0);
  }

  onEmailFocus(): void {
    this.isPasswordFocused = false;
    this.isEmailFocused = true;
  }

  onEmailBlur(): void {
    this.isEmailFocused = false;
    if (this.mascot) this.mascot.resetEyePosition();
  }

  onPasswordAreaFocus(): void {
    this.isPasswordFocused = true;
    this.isEmailFocused = false;
  }

  onPasswordAreaBlur(event: FocusEvent): void {
    if (this.isTogglingPassword) return;
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (relatedTarget && currentTarget.contains(relatedTarget)) return;
    this.isPasswordFocused = false;
  }

  onRememberMeChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      toast.info('Te recordaremos', {
        description: 'Tu email se guardará para la próxima vez',
        duration: 2000,
      });
    }
  }

  private saveRememberMe(): void {
    if (!this.isBrowser) return;
    const { email, rememberMe } = this.loginModel();
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  }
}
