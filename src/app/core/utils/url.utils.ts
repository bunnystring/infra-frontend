const DEFAULT_RETURN_URL = '/app/dashboard';

/**
 * Validates that a returnUrl is a safe internal path to prevent open-redirect attacks.
 * Accepts only relative paths starting with a single "/" — rejects external URLs,
 * protocol-relative URLs (//evil.com), and anything else that could redirect off-site.
 */
export function sanitizeReturnUrl(url: string | undefined | null): string {
  if (!url) return DEFAULT_RETURN_URL;
  const safe = url.startsWith('/') && !url.startsWith('//');
  return safe ? url : DEFAULT_RETURN_URL;
}
