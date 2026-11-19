import { after } from 'next/server';
import { requireRevalidateSecret } from '@/lib/bearer';
import { isEmailConfigured } from '@/lib/email/mailer';
import { isNotifiedStatus, sendOrderStatusEmail } from '@/lib/email/order-status';

/**
 * POST /api/notify/order-status — called by the admin panel after staff
 * change an order's status, so the shopper gets an email.
 *
 *   curl -X POST https://<site>/api/notify/order-status \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"ids":["FB-123456"],"status":"Out for delivery"}'
 *
 * Same shared secret as /api/revalidate. Answers at once and sends the
 * emails after the response. Statuses that are not announced (Confirmed,
 * Packed, Pending) are accepted and ignored, so the admin panel can call
 * this for every change. Each order/status pair is emailed at most once and
 * only if the order really is in that status (see sendOrderStatusEmail).
 */

const ORDER_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const MAX_IDS = 200;
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  const denied = requireRevalidateSecret(request);
  if (denied) return denied;

  let body: { ids?: unknown; status?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: 'Body must be valid JSON.' }, { status: 400, headers: NO_STORE });
  }

  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((v): v is string => typeof v === 'string' && ORDER_ID_RE.test(v)))].slice(0, MAX_IDS)
    : [];
  if (!ids.length || typeof body.status !== 'string') {
    return Response.json({ ok: false, error: 'Expected { ids: string[], status: string }.' }, { status: 400, headers: NO_STORE });
  }

  const status = body.status;
  if (!isNotifiedStatus(status) || !isEmailConfigured()) {
    return Response.json({ ok: true, queued: 0 }, { headers: NO_STORE });
  }

  after(async () => {
    // One at a time: a shared SMTP account (e.g. Gmail) throttles bursts.
    for (const id of ids) await sendOrderStatusEmail(id, status);
  });

  return Response.json({ ok: true, queued: ids.length }, { headers: NO_STORE });
}
