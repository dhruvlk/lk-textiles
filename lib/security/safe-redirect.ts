/**
 * Returns `next` only when it is a same-origin relative path ("/admin/...").
 * Rejects absolute URLs, protocol-relative URLs ("//evil.com"), backslash
 * tricks ("/\\evil.com") and control characters, which `new URL(next, origin)`
 * would otherwise resolve to an external host (open redirect).
 */
export function safeNextPath(next: string | null | undefined, fallback = '/admin'): string {
  if (!next || typeof next !== 'string') return fallback;
  const value = next.trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  try {
    const base = 'http://internal.invalid';
    const resolved = new URL(value, base);
    if (resolved.origin !== base) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
