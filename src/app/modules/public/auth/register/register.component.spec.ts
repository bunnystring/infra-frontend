import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

function buildProviders() {
  const authServiceSpy = {
    isAuthenticated: vi.fn().mockReturnValue(false),
    register: vi.fn(),
  };
  return { authServiceSpy, providers: [{ provide: AuthService, useValue: authServiceSpy }] };
}

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  async function setup() {
    const { providers } = buildProviders();
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...providers,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── Creación ──────────────────────────────────────────────────────────────
  it('debe ser creado', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ── Inicialización del formulario ─────────────────────────────────────────
  describe('initForm', () => {
    it('crea el formulario con los controles requeridos', async () => {
      await setup();
      expect(component.registerForm.contains('name')).toBe(true);
      expect(component.registerForm.contains('email')).toBe(true);
      expect(component.registerForm.contains('password')).toBe(true);
      expect(component.registerForm.contains('confirmPassword')).toBe(true);
    });

    it('formulario es inválido cuando está vacío', async () => {
      await setup();
      expect(component.registerForm.invalid).toBe(true);
    });

    it('formulario es válido con datos correctos', async () => {
      await setup();
      component.registerForm.setValue({
        name: 'Juan Pérez',
        email: 'juan@test.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
      expect(component.registerForm.valid).toBe(true);
    });

    it('invalida si las contraseñas no coinciden', async () => {
      await setup();
      component.registerForm.setValue({
        name: 'Juan Pérez',
        email: 'juan@test.com',
        password: 'Password1!',
        confirmPassword: 'OtraPassword1!',
      });
      expect(component.registerForm.invalid).toBe(true);
    });
  });

  // ── Estado inicial de signals ─────────────────────────────────────────────
  describe('estado inicial de signals', () => {
    it('loading inicia en false', async () => {
      await setup();
      expect(component.loading()).toBe(false);
    });

    it('submitted inicia en false', async () => {
      await setup();
      expect(component.submitted()).toBe(false);
    });

    it('error inicia vacío', async () => {
      await setup();
      expect(component.error()).toBe('');
    });

    it('showPassword inicia en false', async () => {
      await setup();
      expect(component.showPassword()).toBe(false);
    });

    it('showConfirmPassword inicia en false', async () => {
      await setup();
      expect(component.showConfirmPassword()).toBe(false);
    });

    it('isPasswordFocused inicia en false', async () => {
      await setup();
      expect(component.isPasswordFocused()).toBe(false);
    });

    it('isEmailFocused inicia en false', async () => {
      await setup();
      expect(component.isEmailFocused()).toBe(false);
    });

    it('isNameFocused inicia en false', async () => {
      await setup();
      expect(component.isNameFocused()).toBe(false);
    });
  });

  // ── Gestión de foco ───────────────────────────────────────────────────────
  describe('gestión de foco', () => {
    it('onNameFocus activa isNameFocused y desactiva los demás', async () => {
      await setup();
      component.onEmailFocus();
      component.onNameFocus();
      expect(component.isNameFocused()).toBe(true);
      expect(component.isEmailFocused()).toBe(false);
      expect(component.isPasswordFocused()).toBe(false);
      expect(component.currentFieldType()).toBe('name');
    });

    it('onNameBlur desactiva isNameFocused y limpia currentFieldType', async () => {
      await setup();
      component.onNameFocus();
      component.onNameBlur();
      expect(component.isNameFocused()).toBe(false);
      expect(component.currentFieldType()).toBeNull();
    });

    it('onEmailFocus activa isEmailFocused y desactiva los demás', async () => {
      await setup();
      component.onNameFocus();
      component.onEmailFocus();
      expect(component.isEmailFocused()).toBe(true);
      expect(component.isNameFocused()).toBe(false);
      expect(component.isPasswordFocused()).toBe(false);
      expect(component.currentFieldType()).toBe('email');
    });

    it('onEmailBlur desactiva isEmailFocused', async () => {
      await setup();
      component.onEmailFocus();
      component.onEmailBlur();
      expect(component.isEmailFocused()).toBe(false);
      expect(component.currentFieldType()).toBeNull();
    });

    it('onPasswordAreaFocus activa isPasswordFocused y desactiva los demás', async () => {
      await setup();
      component.onEmailFocus();
      component.onPasswordAreaFocus();
      expect(component.isPasswordFocused()).toBe(true);
      expect(component.isEmailFocused()).toBe(false);
      expect(component.isNameFocused()).toBe(false);
      expect(component.currentFieldType()).toBeNull();
    });

    it('onPasswordAreaBlur desactiva isPasswordFocused si foco sale del área', async () => {
      await setup();
      component.onPasswordAreaFocus();
      const fakeEvent = { relatedTarget: null, currentTarget: document.createElement('div') } as unknown as FocusEvent;
      component.onPasswordAreaBlur(fakeEvent);
      expect(component.isPasswordFocused()).toBe(false);
    });
  });

  // ── resetForm ─────────────────────────────────────────────────────────────
  describe('resetForm', () => {
    it('limpia el formulario', async () => {
      await setup();
      component.registerForm.setValue({
        name: 'Juan',
        email: 'j@j.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
      component.resetForm();
      expect(component.registerForm.value.name).toBeFalsy();
    });

    it('restablece submitted a false', async () => {
      await setup();
      component.submitted.set(true);
      component.resetForm();
      expect(component.submitted()).toBe(false);
    });

    it('limpia el error', async () => {
      await setup();
      component.error.set('Algo salió mal');
      component.resetForm();
      expect(component.error()).toBe('');
    });

    it('desactiva todos los signals de foco', async () => {
      await setup();
      component.onEmailFocus();
      component.resetForm();
      expect(component.isEmailFocused()).toBe(false);
      expect(component.isNameFocused()).toBe(false);
      expect(component.isPasswordFocused()).toBe(false);
    });
  });

  // ── onSubmit con formulario inválido ──────────────────────────────────────
  describe('onSubmit', () => {
    it('marca submitted en true al intentar enviar formulario inválido', async () => {
      await setup();
      expect(component.submitted()).toBe(false);
      component.onSubmit();
      await fixture.whenStable();
      expect(component.submitted()).toBe(true);
    });

    it('no activa loading si el formulario es inválido', async () => {
      await setup();
      component.onSubmit();
      await fixture.whenStable();
      expect(component.loading()).toBe(false);
    });
  });

  // ── togglePasswordVisibility ──────────────────────────────────────────────
  describe('togglePasswordVisibility', () => {
    it('cambia showPassword de false a true', async () => {
      await setup();
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

  // ── toggleConfirmPasswordVisibility ───────────────────────────────────────
  describe('toggleConfirmPasswordVisibility', () => {
    it('cambia showConfirmPassword de false a true', async () => {
      await setup();
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(true);
    });
  });

  // ── Getter f ──────────────────────────────────────────────────────────────
  describe('getter f', () => {
    it('retorna los controles del formulario', async () => {
      await setup();
      expect(component.f['name']).toBeDefined();
      expect(component.f['email']).toBeDefined();
      expect(component.f['password']).toBeDefined();
    });
  });
});
