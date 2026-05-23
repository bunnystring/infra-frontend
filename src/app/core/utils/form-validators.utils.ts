import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordMatchValidator = (
  passwordField: string,
  confirmPasswordField: string
): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField);
    const confirmPassword = control.get(confirmPasswordField);

    // Si alguno de los campos no existe, no validar
    if (!password || !confirmPassword) {
      return null;
    }

    // Si el campo de confirmación está vacío, no validar aquí
    if (!confirmPassword.value) {
      return null;
    }

    // Si las contraseñas no coinciden
    if (password.value !== confirmPassword.value) {
      // Marcar error en el campo de confirmación
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Si coinciden, limpiar el error específico de mismatch
    const errors = confirmPassword.errors;
    if (errors && errors['passwordMismatch']) {
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(
        Object.keys(errors).length > 0 ? errors : null
      );
    }

    return null;
  };
};

export const strongPasswordValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

    return !passwordValid ? { weakPassword: true } : null;
  };
};

export const extraStrongPasswordValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid =
      hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { veryWeakPassword: true } : null;
  };
};


export const fullNameValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.trim();

    if (!value) {
      return null;
    }

    // Dividir por espacios y filtrar palabras vacías
    const words = value.split(/\s+/).filter((word: string) => word.length > 0);

    // Verificar que cada palabra tenga al menos 2 caracteres
    const allWordsValid = words.every((word: string) => word.length >= 2);

    if (words.length < 2 || !allWordsValid) {
      return { invalidFullName: true };
    }

    return null;
  };
};

export const noNumbersInNameValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Solo letras (con acentos), espacios y guiones
    const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

    return !validNamePattern.test(value) ? { invalidName: true } : null;
  };
};

export const emailDomainValidator = (allowedDomains: string[]): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const domain = value.split('@')[1];

    if (!domain) {
      return null; // El Validators.email ya maneja esto
    }

    const isAllowed = allowedDomains.some(
      (allowedDomain) =>
        domain.toLowerCase() === allowedDomain.toLowerCase()
    );

    return !isAllowed
      ? {
          invalidDomain: {
            actualDomain: domain,
            allowedDomains: allowedDomains,
          },
        }
      : null;
  };
};

export const corporateEmailValidator = (): ValidatorFn => {
  const freeDomains = [
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
    'live.com',
    'icloud.com',
  ];

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const domain = value.split('@')[1]?.toLowerCase();

    if (!domain) {
      return null;
    }

    const isFreeEmail = freeDomains.includes(domain);

    return isFreeEmail ? { freeEmailNotAllowed: true } : null;
  };
};

export const phoneValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Patrón flexible para teléfonos
    const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

    return !phonePattern.test(value) ? { invalidPhone: true } : null;
  };
};


export const rangeValidator = (min: number, max: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      return { notANumber: true };
    }

    if (numValue < min || numValue > max) {
      return {
        outOfRange: {
          min: min,
          max: max,
          actual: numValue,
        },
      };
    }

    return null;
  };
};

export const positiveNumberValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      return { notANumber: true };
    }

    return numValue <= 0 ? { notPositive: true } : null;
  };
};

export const minAgeValidator = (minAge: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age < minAge
      ? {
          underAge: {
            required: minAge,
            actual: age,
          },
        }
      : null;
  };
};

export const notFutureDateValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate > today ? { futureDate: true } : null;
  };
};

export const urlValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);
      const validProtocols = ['http:', 'https:'];

      return validProtocols.includes(url.protocol)
        ? null
        : { invalidUrl: true };
    } catch {
      return { invalidUrl: true };
    }
  };
};

export const noWhitespaceValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const isWhitespace = (value || '').trim().length === 0;

    return isWhitespace ? { whitespace: true } : null;
  };
};

export const noSpecialCharsValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Solo letras, números, guiones y guiones bajos
    const validPattern = /^[a-zA-Z0-9\-_]+$/;

    return !validPattern.test(value) ? { specialChars: true } : null;
  };
};

export function isXlsxFile(file: File): boolean {
  // Accepts .xls, .xlsx mime-types and extension
  const xlsxMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  const extensionPattern = /\.xlsx?$/i;
  return (
    (file && (xlsxMimeTypes.includes(file.type) || extensionPattern.test(file.name)))
  );
}
