/**
 * Strips any trailing slashes, paths, and known reset-password route fragments
 * so appending `/admin/reset-password` always produces the exact destination once.
 */
export function sanitizeBaseUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  try {
    const hasProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const parsed = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/+(?:admin\/)?reset-password\/?$/i, '')
      .replace(/\/+$/, '');
  }
}

/**
 * Helper to determine the application base URL dynamically across environments:
 * local development, preview deployments, and custom production domains.
 */
export function getAppUrl(): string {
  // 1. In browser runtime: always respect current origin so local testing or custom domains work automatically
  if (typeof window !== 'undefined' && window.location?.origin) {
    return sanitizeBaseUrl(window.location.origin);
  }

  // 2. Explicit environment variables
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return sanitizeBaseUrl(envUrl);
  }

  // 3. Vercel deployment URLs (if available)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return sanitizeBaseUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) {
    return sanitizeBaseUrl(`https://${process.env.VERCEL_URL}`);
  }

  // 4. Default fallback matching project layout default
  return 'https://lk-textiles.vercel.app';
}

/**
 * Returns the exact redirectTo URL for Supabase password recovery.
 * Guarantees `/admin/reset-password` is appended exactly once.
 */
export function getResetPasswordRedirectUrl(): string {
  const baseUrl = getAppUrl();
  return `${baseUrl}/admin/reset-password`;
}
