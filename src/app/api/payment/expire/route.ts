import { revalidateTag } from 'next/cache';
import { requireRevalidateSecret } from '@/lib/bearer';
import { expireStalePayments } from '@/lib/payments/service';

/**
 * POST /api/payment/expire — cancels online orders still waiting for payment
 * after N minutes (default 60, minimum 15) and puts their stock back.
 * Run it from a cron every 10–15 minutes:
 *
 *   curl -X POST https://<site>/api/payment/expire \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET"
 *   # optional: -H "Content-Type: application/json" -d '{"minutes":90}'
 */
export async function POST(request: Request) {
  const denied = requireRevalidateSecret(request);
  if (denied) return denied;

  let minutes = 60;
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    try {
      const body = (await request.json()) as { minutes?: unknown };
      if (body?.minutes !== undefined) {
        const m = Number(body.minutes);
        if (!Number.isInteger(m) || m < 15 || m > 7 * 24 * 60) {
          return Response.json({ ok: false, error: 'minutes must be an integer between 15 and 10080.' }, { status: 400 });
        }
        minutes = m;
      }
    } catch {
      return Response.json({ ok: false, error: 'Body must be valid JSON.' }, { status: 400 });
    }
  }

  const res = await expireStalePayments(minutes);
  if (!res.ok) {
    return Response.json({ ok: false, error: res.error }, { status: res.unavailable ? 503 : 500, headers: { 'Cache-Control': 'no-store' } });
  }
  if (res.cancelled > 0) revalidateTag('catalog', 'max');
  return Response.json({ ok: true, cancelled: res.cancelled, olderThanMinutes: minutes }, { headers: { 'Cache-Control': 'no-store' } });
}
