const DEFAULT_RETURN_URL = '/app/dashboard';

/**
 * Función para sanitizar URLs de retorno, asegurando que sean rutas internas seguras.
 * @param url La URL a sanitizar.
 * @returns Una URL interna segura o la URL de retorno predeterminada.
 */
export function sanitizeReturnUrl(url: string | undefined | null): string {
  if (!url) return DEFAULT_RETURN_URL;
  const safe = url.startsWith('/') && !url.startsWith('//');
  return safe ? url : DEFAULT_RETURN_URL;
}
