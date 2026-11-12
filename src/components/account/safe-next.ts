/**
 * Turns an untrusted `?next=` value into a same-origin relative path.
 * Absolute URLs, protocol-relative `//host` URLs, backslash tricks and
 * control characters are rejected and replaced with the fallback, so the
 * value can never send a visitor to another site after signing in.
 *
 * Plain module (no `server-only`) so proxy.ts, route handlers, server
 * actions and client components can all share it.
 */
export function safeNext(raw: unknown, fallback = '/account'): string {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (!value || value.length > 512) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  // Browsers treat "\" like "/" in URLs ("/\evil.com" → "//evil.com").
  if (value.includes('\\')) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = 'http://freshbasket.invalid';
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    // Dot-segment normalisation can turn "/./..//host" into "//host".
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
    // Never bounce back into the auth forms themselves.
    if (/^\/(login|register|forgot-password|auth)(\/|\?|#|$)/.test(path)) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
