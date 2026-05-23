import { sanitizeReturnUrl } from './url.utils';

describe('sanitizeReturnUrl', () => {
  it('retorna la URL si es una ruta relativa válida', () => {
    expect(sanitizeReturnUrl('/app/dashboard')).toBe('/app/dashboard');
    expect(sanitizeReturnUrl('/app/orders/123')).toBe('/app/orders/123');
    expect(sanitizeReturnUrl('/auth/login')).toBe('/auth/login');
  });

  it('rechaza URLs externas absolutas', () => {
    expect(sanitizeReturnUrl('https://evil.com')).toBe('/app/dashboard');
    expect(sanitizeReturnUrl('http://evil.com/steal')).toBe('/app/dashboard');
  });

  it('rechaza URLs protocol-relative (//evil.com)', () => {
    expect(sanitizeReturnUrl('//evil.com')).toBe('/app/dashboard');
    expect(sanitizeReturnUrl('//evil.com/path')).toBe('/app/dashboard');
  });

  it('rechaza cadenas vacías y valores nulos', () => {
    expect(sanitizeReturnUrl('')).toBe('/app/dashboard');
    expect(sanitizeReturnUrl(null)).toBe('/app/dashboard');
    expect(sanitizeReturnUrl(undefined)).toBe('/app/dashboard');
  });

  it('rechaza javascript: y data: URIs', () => {
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBe('/app/dashboard');
    expect(sanitizeReturnUrl('data:text/html,<script>alert(1)</script>')).toBe('/app/dashboard');
  });
});
