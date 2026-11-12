import 'server-only';
import { createHash } from 'node:crypto';
import { safeEqual } from '@/lib/data/orders';

/**
 * Minimal SSLCommerz (v4 hosted gateway) client using plain fetch.
 *
 *  - initSession():      POST /gwprocess/v4/api.php → GatewayPageURL
 *  - validatePayment():  GET  /validator/api/validationserverAPI.php
 *  - verifyCallbackSignature(): verify_sign / verify_key check, as in the
 *    official PHP library (SslCommerzNotification::SSLCOMMERZ_hash_verify).
 *
 * Credentials come from SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD and
 * are never logged. SSLCOMMERZ_SANDBOX defaults to sandbox unless it is
 * exactly "false".
 */

const SANDBOX_BASE = 'https://sandbox.sslcommerz.com';
const LIVE_BASE = 'https://securepay.sslcommerz.com';
const TIMEOUT_MS = 15_000;

export interface SslcConfig {
  storeId: string;
  storePassword: string;
  sandbox: boolean;
  baseUrl: string;
}

export function sslcommerzConfig(): SslcConfig | null {
  const storeId = process.env.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();
  if (!storeId || !storePassword) return null;
  const sandbox = process.env.SSLCOMMERZ_SANDBOX?.trim().toLowerCase() !== 'false';
  return { storeId, storePassword, sandbox, baseUrl: sandbox ? SANDBOX_BASE : LIVE_BASE };
}

export function isOnlinePaymentEnabled(): boolean {
  return sslcommerzConfig() !== null;
}

/** tran_id we generate in the database: FB123456-<12 hex>. Also accepts other sane ids. */
export const TRAN_ID_RE = /^[A-Za-z0-9_-]{6,30}$/;
const VAL_ID_RE = /^[A-Za-z0-9_-]{4,64}$/;

export function isValidTranId(v: unknown): v is string {
  return typeof v === 'string' && TRAN_ID_RE.test(v);
}
export function isValidValId(v: unknown): v is string {
  return typeof v === 'string' && VAL_ID_RE.test(v);
}

/** Money as the gateway prints it: 2 decimals. */
export function toAmount(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** Exact comparison in paisa; rejects anything that is not a plain decimal number. */
export function sameAmount(gateway: unknown, expected: number): boolean {
  // At most 2 significant decimals ("1200", "1200.5", "1200.50", "1200.5000").
  if (typeof gateway !== 'string' || !/^\d{1,9}(\.\d{1,2}0*)?$/.test(gateway.trim())) return false;
  const a = Number(gateway.trim());
  return Number.isFinite(a) && Math.round(a * 100) === Math.round(expected * 100);
}

const clip = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max);

// ---------------------------------------------------------------------------
// Session init
// ---------------------------------------------------------------------------

export interface SessionInput {
  tranId: string;
  orderId: string;
  total: number;
  customer: { name: string; email?: string; phone: string; address: string; area: string; city: string };
  items: { name: string; qty: number }[];
  urls: { success: string; fail: string; cancel: string; ipn: string };
  fallbackEmail: string;
}

export type SessionResult =
  | { ok: true; gatewayUrl: string; sessionKey: string }
  | { ok: false; reason: string };

/** Builds the form fields for /gwprocess/v4/api.php (field names per developer.sslcommerz.com/doc/v4). */
export function buildSessionFields(cfg: SslcConfig, input: SessionInput): URLSearchParams {
  const qty = input.items.reduce((s, i) => s + i.qty, 0);
  const names = input.items.map((i) => (i.qty > 1 ? `${i.name} x${i.qty}` : i.name));
  let productName = names.slice(0, 5).join(', ');
  if (names.length > 5) productName += ` and ${names.length - 5} more`;

  const email = input.customer.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.customer.email)
    ? input.customer.email
    : input.fallbackEmail;
  const address = clip(`${input.customer.address}, ${input.customer.area}`, 50);
  const city = clip(input.customer.city || 'Dhaka', 50);
  const name = clip(input.customer.name, 50);

  return new URLSearchParams({
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: toAmount(input.total),
    currency: 'BDT',
    tran_id: input.tranId,
    success_url: input.urls.success,
    fail_url: input.urls.fail,
    cancel_url: input.urls.cancel,
    ipn_url: input.urls.ipn,
    // Customer
    cus_name: name,
    cus_email: clip(email, 50),
    cus_add1: address,
    cus_city: city,
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: clip(input.customer.phone, 20),
    // Shipping (we deliver ourselves; fields sent so the gateway has them)
    shipping_method: 'Courier',
    num_of_item: String(Math.max(1, qty)),
    ship_name: name,
    ship_add1: address,
    ship_area: clip(input.customer.area, 50),
    ship_city: city,
    ship_postcode: '1000',
    ship_country: 'Bangladesh',
    // Product
    product_name: clip(productName || 'Groceries', 255),
    product_category: 'Grocery',
    product_profile: 'general',
    // Echoed back on callbacks / validation
    value_a: input.orderId,
  });
}

function isGatewayUrl(u: unknown, cfg: SslcConfig): u is string {
  if (typeof u !== 'string') return false;
  try {
    const url = new URL(u);
    const expectedHost = new URL(cfg.baseUrl).hostname;
    return url.protocol === 'https:' && (url.hostname === expectedHost || url.hostname.endsWith('.sslcommerz.com'));
  } catch {
    return false;
  }
}

export async function initSession(input: SessionInput, cfg: SslcConfig | null = sslcommerzConfig()): Promise<SessionResult> {
  if (!cfg) return { ok: false, reason: 'not-configured' };
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: buildSessionFields(cfg, input),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return { ok: false, reason: `network: ${(e as Error).name}` };
  }
  let body: Record<string, unknown> | null = null;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: `bad response (HTTP ${res.status})` };
  }
  if (body?.status === 'SUCCESS' && isGatewayUrl(body.GatewayPageURL, cfg)) {
    return { ok: true, gatewayUrl: body.GatewayPageURL, sessionKey: String(body.sessionkey ?? '') };
  }
  return { ok: false, reason: clip(String(body?.failedreason ?? body?.status ?? `HTTP ${res.status}`), 200) };
}

// ---------------------------------------------------------------------------
// Validation API
// ---------------------------------------------------------------------------

export type ValidationResponse = Record<string, unknown> & {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  currency_type?: string;
  currency_amount?: string;
  value_a?: string;
  risk_level?: string;
};

/** Ask SSLCommerz (server to server) what really happened to this val_id. Null on network/parse errors. */
export async function validatePayment(valId: string, cfg: SslcConfig | null = sslcommerzConfig()): Promise<ValidationResponse | null> {
  if (!cfg || !isValidValId(valId)) return null;
  const qs = new URLSearchParams({
    val_id: valId,
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    v: '1',
    format: 'json',
  });
  try {
    const res = await fetch(`${cfg.baseUrl}/validator/api/validationserverAPI.php?${qs}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as ValidationResponse;
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// verify_sign
// ---------------------------------------------------------------------------

const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex');

/**
 * Port of SSLCOMMERZ_hash_verify from the official PHP library:
 *   keys = verify_key.split(',');  take each key present in the POST;
 *   add store_passwd = md5(store password);  sort by key;
 *   md5("k1=v1&k2=v2&...")  must equal verify_sign.
 *
 * Returns 'absent' when the callback carries no signature (callers decide
 * whether that is acceptable), 'valid' or 'invalid'.
 */
export function verifyCallbackSignature(
  fields: Record<string, string>,
  cfg: SslcConfig | null = sslcommerzConfig()
): 'valid' | 'invalid' | 'absent' {
  const sign = fields.verify_sign;
  const keyList = fields.verify_key;
  if (!sign && !keyList) return 'absent';
  if (!sign || !keyList || !cfg) return 'invalid';

  const data: Record<string, string> = {};
  for (const k of keyList.split(',')) {
    const key = k.trim();
    if (key && Object.prototype.hasOwnProperty.call(fields, key)) data[key] = fields[key];
  }
  data.store_passwd = md5(cfg.storePassword);
  // PHP ksort on string keys: byte-wise ascending order.
  const keys = Object.keys(data).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const hashString = keys.map((k) => `${k}=${data[k]}`).join('&');
  return safeEqual(md5(hashString), sign.trim().toLowerCase()) ? 'valid' : 'invalid';
}

/** Read an SSLCommerz callback body (form-encoded or multipart) into plain strings. */
export async function readCallbackFields(request: Request): Promise<Record<string, string> | null> {
  const fields: Record<string, string> = {};
  const add = (k: string, v: unknown) => {
    if (typeof v === 'string' && k.length <= 64 && Object.keys(fields).length < 120) fields[k] = v.slice(0, 2000);
  };
  if (request.method === 'GET' || request.method === 'HEAD') {
    new URL(request.url).searchParams.forEach((v, k) => add(k, v));
    return fields;
  }
  const len = Number(request.headers.get('content-length') ?? 0);
  if (len > 64 * 1024) return null;
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const fd = await request.formData();
      fd.forEach((v, k) => add(k, v));
    } else if (type.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      if (body && typeof body === 'object') for (const [k, v] of Object.entries(body)) add(k, v);
    } else {
      new URLSearchParams(await request.text()).forEach((v, k) => add(k, v));
    }
  } catch {
    return null;
  }
  return fields;
}
