import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { formatBDT } from '@/lib/format';
import { isEmailConfigured, sendMail } from './mailer';
import { BRAND, EMAIL_RE, SANS, SERIF, addressLine, esc, num, orderLink, type OrderForEmail } from './order-confirmation';

/**
 * "Your order is on the way / delivered / cancelled" emails.
 *
 * Triggered by the admin panel through POST /api/notify/order-status after
 * staff change an order's status. Each status is emailed at most once per
 * order: sending first claims payment_details.status_emails.<key> with a
 * conditional update (same pattern as the confirmation email), so a status
 * toggled back and forth, a double click or a retry cannot email twice.
 */

/** Statuses the shopper is told about. 'Pending' is covered by the confirmation email. */
export const NOTIFIED_STATUSES = ['Out for delivery', 'Delivered', 'Cancelled'] as const;
export type NotifiedStatus = (typeof NOTIFIED_STATUSES)[number];

export function isNotifiedStatus(v: unknown): v is NotifiedStatus {
  return typeof v === 'string' && (NOTIFIED_STATUSES as readonly string[]).includes(v);
}

const CLAIM_ROOT = 'status_emails';
const CLAIM_KEYS: Record<NotifiedStatus, string> = {
  'Out for delivery': 'out_for_delivery',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

/**
 * Only a status that was set just now is announced. Without this, re-saving
 * the current status of an old order (changed before these emails existed)
 * would email the shopper about something that happened weeks ago.
 */
const FRESH_MS = 15 * 60 * 1000;

interface OrderForStatusEmail extends OrderForEmail {
  status_history: { status?: string; at?: string }[] | null;
}

interface Copy {
  subject: string;
  badge: string;
  badgeColors: { bg: string; border: string; text: string };
  headline: string;
  /** Plain-text paragraphs; escaped when rendered as HTML. */
  body: string[];
  button: string;
}

const GREEN_BADGE = { bg: '#e5f4eb', border: '#c5e5d2', text: '#165b34' };
const GOLD_BADGE = { bg: '#fdf3d7', border: '#f3dc9a', text: '#7a5200' };
const RED_BADGE = { bg: '#fdeaea', border: '#f3c4c4', text: '#8f1d1d' };

function copyFor(status: NotifiedStatus, o: OrderForEmail): Copy {
  const first = o.customer_name.split(/\s+/)[0] || o.customer_name;
  const total = formatBDT(num(o.total));
  const cod = o.payment_method !== 'sslcommerz';

  if (status === 'Out for delivery') {
    return {
      subject: `Order ${o.id} is on the way — ${SITE_NAME}`,
      badge: 'Out for delivery',
      badgeColors: GOLD_BADGE,
      headline: `Your order is on the way, ${first}!`,
      body: [
        `Order ${o.id} has left our store and is heading to you. Please keep ${o.customer_phone} within reach — the rider may call when they arrive.`,
        cod ? `Cash on delivery: please keep ${total} ready.` : 'This order is already paid online, so there is nothing to pay at the door.',
      ],
      button: 'Track your order',
    };
  }

  if (status === 'Delivered') {
    return {
      subject: `Order ${o.id} delivered — ${SITE_NAME}`,
      badge: 'Delivered',
      badgeColors: GREEN_BADGE,
      headline: `Delivered. Enjoy, ${first}!`,
      body: [
        `Order ${o.id} has been delivered. Thank you for shopping with ${SITE_NAME}.`,
        `If anything is missing or not as fresh as it should be, call ${SUPPORT_PHONE} or email ${SUPPORT_EMAIL} and we will sort it out.`,
      ],
      button: 'View your order',
    };
  }

  const refund =
    o.payment_status === 'paid'
      ? `You paid ${total} online for this order. Our team will contact you about your refund.`
      : o.payment_status === 'refunded'
        ? `Your payment of ${total} has been refunded.`
        : 'You have not been charged for this order.';
  return {
    subject: `Order ${o.id} was cancelled — ${SITE_NAME}`,
    badge: 'Order cancelled',
    badgeColors: RED_BADGE,
    headline: `Your order was cancelled`,
    body: [
      `Hi ${first}, order ${o.id} has been cancelled and will not be delivered.`,
      refund,
      `If you did not expect this, call ${SUPPORT_PHONE} or email ${SUPPORT_EMAIL}.`,
    ],
    button: 'View your order',
  };
}

export function renderStatusEmail(status: NotifiedStatus, o: OrderForEmail): { subject: string; html: string; text: string } {
  const c = copyFor(status, o);
  const link = orderLink(o);
  const items = Array.isArray(o.items) ? o.items : [];
  const itemCount = items.reduce((n, it) => n + num(it.qty), 0);
  const showDelivery = status !== 'Cancelled';

  const paragraphs = c.body
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-family:${SANS};font-size:15px;line-height:1.6;color:${BRAND.muted}">${esc(p)}</p>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg}">
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
      <tr><td style="background:${BRAND.forest};border-radius:24px 24px 0 0;padding:26px 32px">
        <span style="font-family:${SERIF};font-size:24px;font-weight:700;color:#ffffff">🌿 Fresh<span style="color:${BRAND.mint}">Basket</span></span>
      </td></tr>
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${BRAND.gold}">&nbsp;</td></tr>
      <tr><td style="background:#ffffff;border-radius:0 0 24px 24px;padding:30px 32px">
        <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${c.badgeColors.bg};border:1px solid ${c.badgeColors.border};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${c.badgeColors.text}">${esc(c.badge)}</span>
        <h1 style="margin:14px 0 10px;font-family:${SERIF};font-size:26px;line-height:1.25;color:${BRAND.ink}">${esc(c.headline)}</h1>
        ${paragraphs}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 24px"><tr>
          <td style="border-radius:999px;background:${BRAND.green}">
            <a href="${esc(link)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(c.button)} &rarr;</a>
          </td>
        </tr></table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:16px">
          <tr><td style="padding:14px 18px;font-family:${SANS};font-size:14px;line-height:1.6;color:${BRAND.ink}">
            <div><span style="color:${BRAND.muted}">Order:</span> ${esc(o.id)} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${formatBDT(num(o.total))}</div>
            ${showDelivery ? `<div><span style="color:${BRAND.muted}">Delivery:</span> ${esc(o.delivery_slot)}</div>` : ''}
            ${showDelivery ? `<div><span style="color:${BRAND.muted}">Address:</span> ${esc(addressLine(o))}</div>` : ''}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    c.headline,
    '',
    ...c.body,
    '',
    `Order: ${o.id} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${formatBDT(num(o.total))}`,
    ...(showDelivery ? [`Delivery: ${o.delivery_slot}`, `Address: ${addressLine(o)}`] : []),
    '',
    `${c.button}: ${link}`,
  ].join('\n');

  return { subject: c.subject, html, text };
}

const COLUMNS =
  'id, access_token, customer_name, customer_email, customer_phone, customer_address, customer_area, customer_city, customer_union, customer_landmark, delivery_slot, items, subtotal, discount, coupon_code, delivery_fee, total, payment_method, payment_status, payment_details, status, status_history, created_at';

export type StatusEmailResult = 'sent' | 'skipped' | 'failed';

/**
 * Emails the shopper that their order reached `status`, if the order really
 * is in that status, it got there in the last few minutes, it has an email
 * address and this status was not emailed before. Never throws.
 */
export async function sendOrderStatusEmail(orderId: string, status: NotifiedStatus): Promise<StatusEmailResult> {
  try {
    if (!isEmailConfigured()) return 'skipped';
    const db = supabaseAdmin();
    const { data, error } = await db.from('orders').select(COLUMNS).eq('id', orderId).maybeSingle();
    if (error) {
      console.error('[email] could not read order', orderId, error.message);
      return 'failed';
    }
    if (!data) return 'skipped';
    const order = data as unknown as OrderForStatusEmail;

    // The database is the source of truth, not what the caller claims.
    if (order.status !== status) return 'skipped';
    const to = (order.customer_email ?? '').trim();
    if (!to || !EMAIL_RE.test(to)) return 'skipped'; // email is optional at checkout

    const history = Array.isArray(order.status_history) ? order.status_history : [];
    const last = history[history.length - 1];
    const changedAt = last?.status === status && last.at ? Date.parse(last.at) : NaN;
    if (!Number.isFinite(changedAt) || Date.now() - changedAt > FRESH_MS) return 'skipped';

    const key = CLAIM_KEYS[status];
    const details = order.payment_details ?? {};
    const sentMap = (details[CLAIM_ROOT] ?? {}) as Record<string, unknown>;
    if (sentMap[key]) return 'skipped';

    // Claim: only one concurrent caller gets a row back.
    const claimed = await db
      .from('orders')
      .update({ payment_details: { ...details, [CLAIM_ROOT]: { ...sentMap, [key]: new Date().toISOString() } } })
      .eq('id', orderId)
      .filter(`payment_details->${CLAIM_ROOT}->>${key}`, 'is', null)
      .select('id');
    if (claimed.error) {
      console.error('[email] could not claim status email', orderId, claimed.error.message);
      return 'failed';
    }
    if (!claimed.data?.length) return 'skipped';

    const ok = await sendMail({ to, ...renderStatusEmail(status, order) });
    if (ok) return 'sent';

    // Release the claim so a retry can send it. Re-read first: another status
    // may have been claimed in the meantime and must be kept.
    const fresh = await db.from('orders').select('payment_details').eq('id', orderId).maybeSingle();
    const freshDetails = (fresh.data?.payment_details ?? null) as Record<string, unknown> | null;
    if (freshDetails) {
      const rest = { ...((freshDetails[CLAIM_ROOT] ?? {}) as Record<string, unknown>) };
      delete rest[key];
      await db.from('orders').update({ payment_details: { ...freshDetails, [CLAIM_ROOT]: rest } }).eq('id', orderId);
    }
    return 'failed';
  } catch (err) {
    console.error('[email] status email failed for', orderId, err instanceof Error ? err.message : err);
    return 'failed';
  }
}
