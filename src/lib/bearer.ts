import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

/** Constant-time string comparison (hash both sides so lengths always match). */
export function sameSecret(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Checks "Authorization: Bearer <REVALIDATE_SECRET>". Returns an error
 * Response to send back, or null when the caller is authorized.
 */
export function requireRevalidateSecret(request: Request): Response | null {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 16) {
    return Response.json({ ok: false, error: 'REVALIDATE_SECRET is not configured on this server.' }, { status: 500 });
  }
  const header = request.headers.get('authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!given || !sameSecret(given, secret)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });
  }
  return null;
}
