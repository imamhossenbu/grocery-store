import 'server-only';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/constants';
import {
  initSession,
  isValidTranId,
  isValidValId,
  sameAmount,
  toAmount,
  validatePayment,
  verifyCallbackSignature,
  type SessionResult,
} from './sslcommerz';

/**
 * Online-payment orchestration between SSLCommerz and the orders table.
 * The database functions (mark_order_paid / mark_payment_failed) enforce the
 * state machine; this file makes sure they are only called with data the
 * gateway itself confirmed.
 */

type Row = Record<string, unknown>;

export interface PaymentOrderRow {
  id: string;
  access_token: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_tran_id: string | null;
  payment_val_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_area: string;
  customer_city: string;
  items: { name: string; qty: number }[];
}

const COLUMNS =
  'id, access_token, total, status, payment_method, payment_status, payment_tran_id, payment_val_id, ' +
  'customer_name, customer_phone, customer_email, customer_address, customer_area, customer_city, items';

function toPaymentRow(r: Row): PaymentOrderRow {
  return {
    id: String(r.id),
    access_token: String(r.access_token ?? ''),
    total: Number(r.total),
    status: String(r.status),
    payment_method: String(r.payment_method ?? 'cod'),
    payment_status: String(r.payment_status ?? 'unpaid'),
    payment_tran_id: r.payment_tran_id ? String(r.payment_tran_id) : null,
    payment_val_id: r.payment_val_id ? String(r.payment_val_id) : null,
    customer_name: String(r.customer_name ?? ''),
    customer_phone: String(r.customer_phone ?? ''),
    customer_email: r.customer_email ? String(r.customer_email) : null,
    customer_address: String(r.customer_address ?? ''),
    customer_area: String(r.customer_area ?? ''),
    customer_city: String(r.customer_city ?? 'Dhaka'),
    items: Array.isArray(r.items)
      ? (r.items as Row[]).map((i) => ({ name: String(i.name ?? ''), qty: Number(i.qty ?? 1) }))
      : [],
  };
}

export type RowLookup =
  | { state: 'ok'; row: PaymentOrderRow }
  | { state: 'not-found' }
  | { state: 'unavailable' };

async function lookup(column: 'payment_tran_id' | 'id', value: string): Promise<RowLookup> {
  const { data, error } = await supabaseAdmin().from('orders').select(COLUMNS).eq(column, value).maybeSingle();
  // 42703 = column does not exist (schema.sql not re-run yet).
  if (isMissingTableError(error) || error?.code === '42703') return { state: 'unavailable' };
  if (error) throw new Error(`orders: ${error.message}`);
  return data ? { state: 'ok', row: toPaymentRow(data as unknown as Row) } : { state: 'not-found' };
}

export function findOrderByTranId(tranId: string): Promise<RowLookup> {
  if (!isValidTranId(tranId)) return Promise.resolve({ state: 'not-found' });
  return lookup('payment_tran_id', tranId);
}

export function findPaymentOrderById(id: string): Promise<RowLookup> {
  return lookup('id', id);
}

export const CALLBACK_PATHS = {
  success: '/api/payment/sslcommerz/success',
  fail: '/api/payment/sslcommerz/fail',
  cancel: '/api/payment/sslcommerz/cancel',
  ipn: '/api/payment/sslcommerz/ipn',
} as const;

export function callbackUrls() {
  return {
    success: `${SITE_URL}${CALLBACK_PATHS.success}`,
    fail: `${SITE_URL}${CALLBACK_PATHS.fail}`,
    cancel: `${SITE_URL}${CALLBACK_PATHS.cancel}`,
    ipn: `${SITE_URL}${CALLBACK_PATHS.ipn}`,
  };
}

/** Where the shopper lands after the gateway. The token comes from the database, never from the callback body. */
export function orderReturnUrl(row: Pick<PaymentOrderRow, 'id' | 'access_token'>, payment?: 'success' | 'failed' | 'cancelled'): string {
  const qs = new URLSearchParams({ token: row.access_token });
  if (payment) qs.set('payment', payment);
  return `${SITE_URL}/order/${encodeURIComponent(row.id)}?${qs}`;
}

/** Open a gateway session for an online order, using the database total (never a client value). */
export async function startGatewaySession(row: PaymentOrderRow): Promise<SessionResult> {
  if (row.payment_method !== 'sslcommerz' || !row.payment_tran_id) return { ok: false, reason: 'not an online order' };
  return initSession({
    tranId: row.payment_tran_id,
    orderId: row.id,
    total: row.total,
    customer: {
      name: row.customer_name,
      email: row.customer_email ?? undefined,
      phone: row.customer_phone,
      address: row.customer_address,
      area: row.customer_area,
      city: row.customer_city,
    },
    items: row.items,
    urls: callbackUrls(),
    fallbackEmail: SUPPORT_EMAIL,
  });
}

// ---------------------------------------------------------------------------
// Confirm (success callback + IPN)
// ---------------------------------------------------------------------------

export type ConfirmOutcome =
  | { outcome: 'paid' | 'already-paid' | 'late-paid'; row: PaymentOrderRow }
  | { outcome: 'rejected'; reason: string; row?: PaymentOrderRow }
  | { outcome: 'not-found' | 'unavailable' }
  | { outcome: 'error'; reason: string; row?: PaymentOrderRow };

const DETAIL_KEYS = [
  'status', 'tran_date', 'tran_id', 'val_id', 'amount', 'store_amount', 'currency', 'bank_tran_id',
  'card_type', 'card_no', 'card_issuer', 'card_brand', 'card_issuer_country', 'currency_type',
  'currency_amount', 'risk_level', 'risk_title', 'validated_on',
] as const;

/**
 * Never trusts the POSTed status. Rules, in order:
 *  1. tran_id well-formed; verify_sign must match when present.
 *  2. Order exists for that tran_id and is an online order.
 *  3. Validation API (server to server) for the POSTed val_id says
 *     status VALID or VALIDATED, same tran_id (and val_id, value_a when
 *     returned), currency BDT, amount == order total exactly.
 *  4. mark_order_paid() re-checks amount and state under a row lock.
 */
export async function confirmOnlinePayment(fields: Record<string, string>): Promise<ConfirmOutcome> {
  const tranId = fields.tran_id;
  if (!isValidTranId(tranId)) return { outcome: 'rejected', reason: 'missing or malformed tran_id' };
  if (verifyCallbackSignature(fields) === 'invalid') return { outcome: 'rejected', reason: 'verify_sign mismatch' };

  const found = await findOrderByTranId(tranId);
  if (found.state !== 'ok') return { outcome: found.state };
  const row = found.row;
  if (row.payment_method !== 'sslcommerz') return { outcome: 'rejected', reason: 'not an online order', row };

  const valId = fields.val_id;
  if (row.payment_status === 'paid' && row.payment_val_id && row.payment_val_id === valId) {
    return { outcome: 'already-paid', row };
  }
  if (!isValidValId(valId)) return { outcome: 'rejected', reason: 'missing or malformed val_id', row };

  const v = await validatePayment(valId);
  if (!v) return { outcome: 'error', reason: 'validation API unreachable', row };

  const problems: string[] = [];
  if (v.status !== 'VALID' && v.status !== 'VALIDATED') problems.push(`status ${String(v.status)}`);
  if (v.tran_id !== tranId) problems.push('tran_id mismatch');
  if (v.val_id !== undefined && v.val_id !== valId) problems.push('val_id mismatch');
  if (v.currency !== 'BDT') problems.push('currency is not BDT');
  if (v.currency_type !== undefined && v.currency_type !== 'BDT') problems.push('currency_type is not BDT');
  if (!sameAmount(v.amount, row.total)) problems.push('amount mismatch');
  if (v.currency_amount !== undefined && !sameAmount(v.currency_amount, row.total)) problems.push('currency_amount mismatch');
  if (v.value_a !== undefined && v.value_a !== '' && v.value_a !== row.id) problems.push('value_a mismatch');
  if (problems.length > 0) {
    console.warn('[payment] validation rejected', row.id, problems.join(', '));
    return { outcome: 'rejected', reason: problems.join(', '), row };
  }

  const details: Record<string, unknown> = { gateway: 'sslcommerz' };
  for (const k of DETAIL_KEYS) if (v[k] !== undefined && v[k] !== null) details[k] = v[k];
  if (v.risk_level === '1') console.warn('[payment] high-risk payment flagged by SSLCommerz for order', row.id);

  const { data, error } = await supabaseAdmin().rpc('mark_order_paid', {
    p_tran_id: tranId,
    p_val_id: valId,
    p_amount: toAmount(Number(v.amount)),
    p_details: details,
  });
  if (error) {
    console.error('[payment] mark_order_paid failed for', row.id, error.message);
    return { outcome: 'error', reason: error.message, row };
  }
  const updated = toPaymentRow(data as Row);
  const late = updated.status === 'Cancelled';
  if (late) console.error('[payment] payment received for a CANCELLED order — refund or re-open it:', row.id);
  return { outcome: late ? 'late-paid' : 'paid', row: updated };
}

// ---------------------------------------------------------------------------
// Fail / cancel / expire
// ---------------------------------------------------------------------------

export type FailOutcome =
  | { outcome: 'updated' | 'unchanged'; row: PaymentOrderRow }
  | { outcome: 'rejected'; reason: string }
  | { outcome: 'not-found' | 'unavailable' }
  | { outcome: 'error'; reason: string; row?: PaymentOrderRow };

export async function failOnlinePayment(
  tranId: string,
  status: 'failed' | 'cancelled',
  reason: string,
  orderIdHint?: string
): Promise<FailOutcome> {
  if (!isValidTranId(tranId)) return { outcome: 'rejected', reason: 'missing or malformed tran_id' };
  const found = await findOrderByTranId(tranId);
  if (found.state !== 'ok') return { outcome: found.state };
  // value_a echoes our order id; if the gateway sent it, it must agree.
  if (orderIdHint && orderIdHint !== found.row.id) return { outcome: 'rejected', reason: 'value_a mismatch' };
  if (found.row.payment_status !== 'pending') return { outcome: 'unchanged', row: found.row };

  const { data, error } = await supabaseAdmin().rpc('mark_payment_failed', {
    p_tran_id: tranId,
    p_status: status,
    p_reason: reason.slice(0, 200),
  });
  if (error) {
    console.error('[payment] mark_payment_failed failed for', found.row.id, error.message);
    return { outcome: 'error', reason: error.message, row: found.row };
  }
  return { outcome: 'updated', row: toPaymentRow(data as Row) };
}

export async function expireStalePayments(minutes: number): Promise<{ ok: true; cancelled: number } | { ok: false; error: string; unavailable?: boolean }> {
  const { data, error } = await supabaseAdmin().rpc('expire_stale_payments', { p_minutes: minutes });
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'Database not set up yet', unavailable: true };
    return { ok: false, error: error.message };
  }
  return { ok: true, cancelled: Number(data ?? 0) };
}

