const DEFAULT_RETURN_URL = '/app/dashboard';

export function sanitizeReturnUrl(url: string | undefined | null): string {
  if (!url) return DEFAULT_RETURN_URL;
  const safe = url.startsWith('/') && !url.startsWith('//');
  return safe ? url : DEFAULT_RETURN_URL;
}
