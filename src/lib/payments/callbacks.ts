import 'server-only';
import { revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { sendOrderConfirmation } from '@/lib/email/order-confirmation';
import { SITE_NAME, SUPPORT_PHONE } from '@/lib/constants';
import { readCallbackFields, verifyCallbackSignature } from './sslcommerz';
import { confirmOnlinePayment, failOnlinePayment, orderReturnUrl, type PaymentOrderRow } from './service';

/**
 * Shared logic for the SSLCommerz callback route handlers.
 *
 * success / fail / cancel are cross-site form POSTs from the shopper's
 * browser (SSLCommerz auto-submits a form back to us). Route Handlers have no
 * CSRF/Origin check (only Server Actions do), and src/proxy.ts skips
 * /api/payment, so nothing blocks them. They answer with a 303 to the order
 * page; the access token is read from the database by tran_id, never taken
 * from the POST body.
 *
 * The IPN is a server-to-server POST and answers with plain text.
 */

const NO_STORE = { 'Cache-Control': 'no-store' };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Small standalone page for callbacks we cannot match to an order. */
function problemPage(status: number, title: string, body: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} · ${SITE_NAME}</title>
<style>body{font-family:system-ui,sans-serif;background:#f6faf7;color:#112a1d;margin:0;padding:48px 16px}main{max-width:520px;margin:0 auto;background:#fff;border:1px solid #dfece3;border-radius:24px;padding:28px}a{color:#1a663b;font-weight:700}</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p><p>If money was taken from your account, call ${escapeHtml(SUPPORT_PHONE)} with your transaction details — we will sort it out.</p>
<p><a href="/track-order">Track an order</a> · <a href="/">Back to the shop</a></p></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE } });
}

function redirect303(url: string): Response {
  return new Response(null, { status: 303, headers: { Location: url, ...NO_STORE, 'Referrer-Policy': 'no-referrer' } });
}

const unmatched = () =>
  problemPage(400, 'We could not match this payment', 'The payment gateway sent us details we could not match to an order.');
const notReady = () =>
  problemPage(503, 'Payments are not available yet', 'Our online store is still being set up, so this payment could not be recorded.');

function returnFor(row: PaymentOrderRow, wanted: 'success' | 'failed' | 'cancelled'): Response {
  // The page shows the real state from the database; the flag only picks the banner.
  return redirect303(orderReturnUrl(row, row.payment_status === 'paid' ? 'success' : wanted));
}

/** Order email after the response; sendOrderConfirmation() sends at most once per order. */
function queueConfirmation(orderId: string) {
  after(() => sendOrderConfirmation(orderId));
}

export async function handleSuccessCallback(request: Request): Promise<Response> {
  const fields = await readCallbackFields(request);
  if (!fields) return unmatched();

  const res = await confirmOnlinePayment(fields);
  switch (res.outcome) {
    case 'paid':
    case 'late-paid':
      revalidateTag('catalog', 'max');
      if (res.outcome === 'paid') queueConfirmation(res.row.id);
      return returnFor(res.row, 'success');
    case 'already-paid':
      return returnFor(res.row, 'success');
    case 'rejected':
    case 'error':
      // Not marked paid. If we know the order, send the shopper to it: it
      // will show "still confirming" with a "Complete payment" button while
      // the payment is pending (the IPN may still confirm it).
      return res.row ? returnFor(res.row, 'success') : unmatched();
    case 'unavailable':
      return notReady();
    default:
      return unmatched();
  }
}

export async function handleFailOrCancelCallback(request: Request, kind: 'failed' | 'cancelled'): Promise<Response> {
  const fields = await readCallbackFields(request);
  if (!fields) return unmatched();
  // A forged signature is rejected outright; an absent one is tolerated
  // because the unguessable tran_id is itself the shopper's proof.
  if (verifyCallbackSignature(fields) === 'invalid') return unmatched();

  const reason = `gateway ${kind}${fields.error ? `: ${fields.error}` : ''}`;
  const res = await failOnlinePayment(fields.tran_id ?? '', kind, reason, fields.value_a || undefined);
  switch (res.outcome) {
    case 'updated':
      revalidateTag('catalog', 'max'); // stock was put back
      return returnFor(res.row, kind);
    case 'unchanged':
      return returnFor(res.row, kind);
    case 'error':
      return res.row ? returnFor(res.row, kind) : unmatched();
    case 'unavailable':
      return notReady();
    default:
      return unmatched();
  }
}

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...NO_STORE } });

export async function handleIpn(request: Request): Promise<Response> {
  const fields = await readCallbackFields(request);
  if (!fields) return text('BAD_REQUEST', 400);

  const status = (fields.status ?? '').toUpperCase();
  if (status === 'VALID' || status === 'VALIDATED') {
    const res = await confirmOnlinePayment(fields);
    switch (res.outcome) {
      case 'paid':
      case 'late-paid':
        revalidateTag('catalog', 'max');
        if (res.outcome === 'paid') queueConfirmation(res.row.id);
        return text('OK');
      case 'already-paid':
        return text('OK');
      case 'rejected':
        return text('REJECTED', 400);
      case 'not-found':
        return text('UNKNOWN_TRANSACTION', 404);
      case 'unavailable':
        return text('UNAVAILABLE', 503);
      default:
        return text('ERROR', 500); // non-2xx so the gateway may retry
    }
  }

  // FAILED / CANCELLED / UNATTEMPTED / EXPIRED: acknowledge but do not cancel
  // here. A failed attempt may be followed by a successful retry inside the
  // same gateway session; the browser fail/cancel callback or the
  // expire_stale_payments job releases the stock instead.
  if (['FAILED', 'CANCELLED', 'UNATTEMPTED', 'EXPIRED'].includes(status)) return text('ACKNOWLEDGED');
  return text('IGNORED');
}
