import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../models/auth.model';

const mockAuthResponse: AuthResponse = {
  accessToken: 'token-abc',
  refreshToken: 'refresh-abc',
  user: { email: 'test@test.com', name: 'Test' },
};

function buildProviders(
  loginResult: 'success' | 'error' = 'success',
) {
  const authServiceSpy = {
    isAuthenticated: vi.fn().mockReturnValue(false),
    login: vi.fn().mockReturnValue(
      loginResult === 'success'
        ? of(mockAuthResponse)
        : throwError(() => ({ error: { message: 'Credenciales inválidas' } })),
    ),
  };
  return { authServiceSpy, providers: [{ provide: AuthService, useValue: authServiceSpy }] };
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  async function setup(loginResult: 'success' | 'error' = 'success') {
    const { providers } = buildProviders(loginResult);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        ...providers,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── Creación ──────────────────────────────────────────────────────────────
  it('debe ser creado', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ── Estado inicial de signals ─────────────────────────────────────────────
  describe('estado inicial', () => {
    it('showPassword inicia en false', async () => {
      await setup();
      expect(component.showPassword()).toBe(false);
    });

    it('loading inicia en false', async () => {
      await setup();
      expect(component.loading()).toBe(false);
    });

    it('isPasswordFocused inicia en false', async () => {
      await setup();
      expect(component.isPasswordFocused()).toBe(false);
    });

    it('isEmailFocused inicia en false', async () => {
      await setup();
      expect(component.isEmailFocused()).toBe(false);
    });
  });

  // ── Gestión de foco ───────────────────────────────────────────────────────
  describe('gestión de foco', () => {
    it('onEmailFocus activa isEmailFocused y desactiva isPasswordFocused', async () => {
      await setup();
      component.onPasswordAreaFocus();
      component.onEmailFocus();
      expect(component.isEmailFocused()).toBe(true);
      expect(component.isPasswordFocused()).toBe(false);
    });

    it('onEmailBlur desactiva isEmailFocused', async () => {
      await setup();
      component.onEmailFocus();
      component.onEmailBlur();
      expect(component.isEmailFocused()).toBe(false);
    });

    it('onPasswordAreaFocus activa isPasswordFocused y desactiva isEmailFocused', async () => {
      await setup();
      component.onEmailFocus();
      component.onPasswordAreaFocus();
      expect(component.isPasswordFocused()).toBe(true);
      expect(component.isEmailFocused()).toBe(false);
    });

    it('onPasswordAreaBlur desactiva isPasswordFocused si el foco sale del área', async () => {
      await setup();
      component.onPasswordAreaFocus();
      const fakeEvent = { relatedTarget: null, currentTarget: document.createElement('div') } as unknown as FocusEvent;
      component.onPasswordAreaBlur(fakeEvent);
      expect(component.isPasswordFocused()).toBe(false);
    });

    it('onPasswordAreaBlur mantiene foco si relatedTarget está dentro del área', async () => {
      await setup();
      component.onPasswordAreaFocus();
      const parent = document.createElement('div');
      const child = document.createElement('button');
      parent.appendChild(child);
      const fakeEvent = { relatedTarget: child, currentTarget: parent } as unknown as FocusEvent;
      component.onPasswordAreaBlur(fakeEvent);
      expect(component.isPasswordFocused()).toBe(true);
    });
  });

  // ── togglePasswordVisibility ──────────────────────────────────────────────
  describe('togglePasswordVisibility', () => {
    it('cambia showPassword de false a true', async () => {
      await setup();
      expect(component.showPassword()).toBe(false);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);
    });

    it('cambia showPassword de true a false', async () => {
      await setup();
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(false);
    });
  });

  // ── resetForm ─────────────────────────────────────────────────────────────
  describe('resetForm', () => {
    it('limpia email y password del modelo', async () => {
      await setup();
      component.loginModel.update((m) => ({ ...m, email: 'a@b.com', password: '123456' }));
      component.resetForm();
      expect(component.loginModel().email).toBe('');
      expect(component.loginModel().password).toBe('');
    });

    it('pone rememberMe en false', async () => {
      await setup();
      component.loginModel.update((m) => ({ ...m, rememberMe: true }));
      component.resetForm();
      expect(component.loginModel().rememberMe).toBe(false);
    });
  });
});
