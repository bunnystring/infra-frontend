import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Utilidades de Validación para Formularios Reactivos
 * Colección de validadores personalizados reutilizables
 * Pattern: Export functions para máxima reutilización
 *
 * @author Bunnystring
 * @since 2026-02-10
 */


/**
 * Validator para verificar que dos campos de contraseña coincidan
 * Se aplica a nivel de FormGroup, no a un control individual
 *
 * @param passwordField - Nombre del campo de contraseña
 * @param confirmPasswordField - Nombre del campo de confirmación
 * @returns ValidatorFn que retorna ValidationErrors o null
 */
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

/**
 * Validator para contraseña segura
 * Requiere: al menos 1 mayúscula, 1 minúscula y 1 número
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para contraseña extra segura
 * Requiere: mayúsculas, minúsculas, números Y caracteres especiales
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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


/**
 * Validator para nombre completo
 * Requiere al menos 2 palabras (nombre y apellido)
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 */
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

/**
 * Validator para nombres sin números
 * Verifica que el nombre solo contenga letras y espacios
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 */
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

/**
 * Validator para email con dominios específicos permitidos
 * Útil para restricciones corporativas o educativas
 *
 * @param allowedDomains - Array de dominios permitidos (sin @)
 * @returns ValidatorFn que retorna ValidationErrors o null
 */
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

/**
 * Validator para email corporativo
 * Rechaza dominios de email gratuitos comunes
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para número de teléfono (formato internacional o local)
 * Acepta: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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


/**
 * Validator para rango numérico
 * Verifica que un número esté entre min y max (inclusive)
 *
 * @param min - Valor mínimo permitido
 * @param max - Valor máximo permitido
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para números positivos solamente
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para edad mínima
 * Verifica que la fecha de nacimiento corresponda a una edad mínima
 *
 * @param minAge - Edad mínima requerida en años
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para fecha no futura
 * Verifica que la fecha no sea posterior a hoy
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 */
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

/**
 * Validator para URLs válidas
 * Verifica formato de URL con protocolo http/https
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para whitespace
 * Verifica que el campo no contenga solo espacios en blanco
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para caracteres especiales no permitidos
 * Útil para nombres de usuario, slugs, etc.
 *
 * @returns ValidatorFn que retorna ValidationErrors o null
 *
 */
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

/**
 * Validator para archivos Excel (.xls, .xlsx)
 * Verifica el tipo MIME y la extensión del archivo
 * @param file - Archivo a validar
 * @returns boolean - true si el archivo es un Excel válido, false en caso contrario
 */
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
