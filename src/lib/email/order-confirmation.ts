import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { formatBDT } from '@/lib/format';
import { isEmailConfigured, sendMail } from './mailer';

/**
 * "Order confirmed" email to the address the shopper typed at checkout.
 *
 * Sent once per order: cash on delivery right after place_order(), online
 * payments after mark_order_paid(). The SSLCommerz success redirect and IPN
 * can both report the same payment, so sending first *claims* the order by
 * writing payment_details.confirmation_email_sent_at with a conditional
 * update; only the request whose update matched a row sends the email.
 * (payment_details is otherwise only written by the payment functions.)
 */

const BRAND = {
  forest: '#0f2c1d',
  green: '#1a663b',
  mint: '#3ed481',
  gold: '#f5b82e',
  ink: '#112a1d',
  muted: '#5a7165',
  line: '#e2efe6',
  bg: '#eef5f0',
  soft: '#f4f9f5',
};
const SANS = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";
const CLAIM_KEY = 'confirmation_email_sent_at';

interface OrderItem {
  name: string;
  unit: string;
  price: number;
  qty: number;
  image?: string;
}

interface OrderForEmail {
  id: string;
  access_token: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string;
  customer_area: string | null;
  customer_city: string | null;
  customer_union?: string | null;
  customer_landmark?: string | null;
  delivery_slot: string;
  items: OrderItem[];
  subtotal: number | string;
  discount: number | string;
  coupon_code: string | null;
  delivery_fee: number | string;
  total: number | string;
  payment_method: string;
  payment_status: string | null;
  payment_details: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PLACED = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Dhaka',
});

export function orderLink(o: Pick<OrderForEmail, 'id' | 'access_token'>): string {
  return `${SITE_URL}/order/${encodeURIComponent(o.id)}?token=${encodeURIComponent(o.access_token)}`;
}

function addressLine(o: OrderForEmail): string {
  return [o.customer_address, o.customer_union, o.customer_area, o.customer_city].filter(Boolean).join(', ');
}

function paymentLine(o: OrderForEmail): string {
  if (o.payment_method === 'sslcommerz') {
    const card = typeof o.payment_details?.card_type === 'string' ? ` (${o.payment_details.card_type.split('-')[0]})` : '';
    return o.payment_status === 'paid' ? `Paid online${card}` : 'Online payment';
  }
  return `Cash on delivery — please keep ${formatBDT(num(o.total))} ready`;
}

export function renderOrderEmail(o: OrderForEmail): { subject: string; html: string; text: string } {
  const first = o.customer_name.split(/\s+/)[0] || o.customer_name;
  const link = orderLink(o);
  const items = Array.isArray(o.items) ? o.items : [];
  const subject = `Order ${o.id} confirmed — ${SITE_NAME}`;
  const placed = PLACED.format(new Date(o.created_at));
  const discount = num(o.discount);
  const fee = num(o.delivery_fee);

  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:4px 0;font-family:${SANS};font-size:14px;color:${strong ? BRAND.ink : BRAND.muted};${strong ? 'font-weight:700;' : ''}">${label}</td>
      <td align="right" style="padding:4px 0;font-family:${SANS};font-size:${strong ? 17 : 14}px;color:${BRAND.ink};${strong ? 'font-weight:700;' : ''}">${value}</td>
    </tr>`;

  const itemRows = items
    .map(
      (it) => `
    <tr>
      <td width="56" style="padding:10px 0;border-bottom:1px solid ${BRAND.line}">
        ${it.image ? `<img src="${esc(it.image)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:10px;object-fit:cover;background:${BRAND.soft}">` : ''}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-family:${SANS};font-size:14px;color:${BRAND.ink}">
        <div style="font-weight:600">${esc(it.name)}</div>
        <div style="font-size:13px;color:${BRAND.muted}">${esc(it.unit)} · ${num(it.qty)} × ${formatBDT(num(it.price))}</div>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-family:${SANS};font-size:14px;font-weight:600;color:${BRAND.ink};white-space:nowrap">${formatBDT(num(it.price) * num(it.qty))}</td>
    </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg}">
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
      <tr><td style="background:${BRAND.forest};border-radius:24px 24px 0 0;padding:26px 32px">
        <span style="font-family:${SERIF};font-size:24px;font-weight:700;color:#ffffff">🌿 Fresh<span style="color:${BRAND.mint}">Basket</span></span>
      </td></tr>
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${BRAND.gold}">&nbsp;</td></tr>
      <tr><td style="background:#ffffff;border-radius:0 0 24px 24px;padding:30px 32px">
        <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:#e5f4eb;border:1px solid #c5e5d2;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#165b34">Order confirmed</span>
        <h1 style="margin:14px 0 6px;font-family:${SERIF};font-size:26px;line-height:1.25;color:${BRAND.ink}">Thank you, ${esc(first)}!</h1>
        <p style="margin:0 0 20px;font-family:${SANS};font-size:15px;line-height:1.6;color:${BRAND.muted}">
          We have your order <strong style="color:${BRAND.ink}">${esc(o.id)}</strong> (placed ${esc(placed)}). We'll call
          <strong style="color:${BRAND.ink}">${esc(o.customer_phone)}</strong> if we need anything.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr>
          <td style="border-radius:999px;background:${BRAND.green}">
            <a href="${esc(link)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Track your order &rarr;</a>
          </td>
        </tr></table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:16px">
          <tr><td style="padding:14px 18px;font-family:${SANS};font-size:14px;line-height:1.6;color:${BRAND.ink}">
            <div><span style="color:${BRAND.muted}">Delivery:</span> ${esc(o.delivery_slot)}</div>
            <div><span style="color:${BRAND.muted}">Address:</span> ${esc(addressLine(o))}</div>
            ${o.customer_landmark ? `<div><span style="color:${BRAND.muted}">Landmark:</span> ${esc(o.customer_landmark)}</div>` : ''}
            <div><span style="color:${BRAND.muted}">Payment:</span> ${esc(paymentLine(o))}</div>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px">${itemRows}</table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">
          ${row('Subtotal', formatBDT(num(o.subtotal)))}
          ${discount > 0 ? row(`Discount${o.coupon_code ? ` (${esc(o.coupon_code)})` : ''}`, `−${formatBDT(discount)}`) : ''}
          ${row('Delivery', fee > 0 ? formatBDT(fee) : 'Free')}
          ${row('Total', formatBDT(num(o.total)), true)}
        </table>

        <p style="margin:24px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${BRAND.muted}">
          You can also track it any time at <a href="${esc(`${SITE_URL}/track-order`)}" style="color:${BRAND.green}">${esc(SITE_URL.replace(/^https?:\/\//, ''))}/track-order</a>
          with order ID <strong>${esc(o.id)}</strong> and your mobile number.<br>
          Questions? Call ${esc(SUPPORT_PHONE)} or email ${esc(SUPPORT_EMAIL)}.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    `Thank you, ${first}! Your ${SITE_NAME} order ${o.id} is confirmed (placed ${placed}).`,
    '',
    ...items.map((it) => `- ${it.name} (${it.unit}) ${num(it.qty)} x ${formatBDT(num(it.price))} = ${formatBDT(num(it.price) * num(it.qty))}`),
    '',
    `Subtotal: ${formatBDT(num(o.subtotal))}`,
    ...(discount > 0 ? [`Discount${o.coupon_code ? ` (${o.coupon_code})` : ''}: -${formatBDT(discount)}`] : []),
    `Delivery: ${fee > 0 ? formatBDT(fee) : 'Free'}`,
    `Total: ${formatBDT(num(o.total))}`,
    '',
    `Delivery: ${o.delivery_slot}`,
    `Address: ${addressLine(o)}`,
    `Payment: ${paymentLine(o)}`,
    '',
    `Track your order: ${link}`,
    `Or use ${SITE_URL}/track-order with order ID ${o.id} and your mobile number.`,
    `Questions? Call ${SUPPORT_PHONE}.`,
  ].join('\n');

  return { subject, html, text };
}

const COLUMNS =
  'id, access_token, customer_name, customer_email, customer_phone, customer_address, customer_area, customer_city, customer_union, customer_landmark, delivery_slot, items, subtotal, discount, coupon_code, delivery_fee, total, payment_method, payment_status, payment_details, status, created_at';

/**
 * Sends the confirmation for one order if it has an email and has not been
 * sent yet. Safe to call more than once and from parallel requests. Never
 * throws (runs in after(), outside the shopper's request).
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    if (!isEmailConfigured()) return;
    const db = supabaseAdmin();
    const { data, error } = await db.from('orders').select(COLUMNS).eq('id', orderId).maybeSingle();
    if (error || !data) {
      if (error) console.error('[email] could not read order', orderId, error.message);
      return;
    }
    const order = data as unknown as OrderForEmail;
    const to = (order.customer_email ?? '').trim();
    if (!to || !EMAIL_RE.test(to)) return; // email is optional at checkout
    if (order.status === 'Cancelled') return;
    if (order.payment_method === 'sslcommerz' && order.payment_status !== 'paid') return;
    const details = order.payment_details ?? {};
    if (details[CLAIM_KEY]) return;

    // Claim: only one concurrent caller gets a row back.
    const claimed = await db
      .from('orders')
      .update({ payment_details: { ...details, [CLAIM_KEY]: new Date().toISOString() } })
      .eq('id', orderId)
      .filter(`payment_details->>${CLAIM_KEY}`, 'is', null)
      .select('id');
    if (claimed.error || !claimed.data?.length) return;

    const ok = await sendMail({ to, ...renderOrderEmail(order) });
    if (!ok) {
      // Release the claim so a later callback (e.g. the IPN) can try again.
      await db.from('orders').update({ payment_details: order.payment_details }).eq('id', orderId);
    }
  } catch (err) {
    console.error('[email] order confirmation failed for', orderId, err instanceof Error ? err.message : err);
  }
}
