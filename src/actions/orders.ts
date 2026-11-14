'use server';

import { headers } from 'next/headers';
import { after } from 'next/server';
import { sendOrderConfirmation } from '@/lib/email/order-confirmation';
import { updateTag } from 'next/cache';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/server';
import { getProductsByIds } from '@/lib/data/catalog';
import { findOrderByIdAndPhone, getOrderForViewer } from '@/lib/data/orders';
import { isOnlinePaymentEnabled } from '@/lib/payments/sslcommerz';
import { failOnlinePayment, findPaymentOrderById, startGatewaySession } from '@/lib/payments/service';
import { INITIAL_STORE_DATA } from '@/lib/seed-data';
import { toCoupon } from '@/lib/data/mappers';
import { discountFor } from '@/lib/pricing';
import { formatBDT, normalizePhone } from '@/lib/format';
import { asDeliveryDay, readCheckoutInput, validateCheckout } from '@/components/order/validation';
import { COURIER_DELIVERY_TEXT, deliverySlotText, isSlotAvailable } from '@/components/order/delivery';
import { resolveAddress } from '@/lib/address/geo';
import { DHAKA_DISTRICT_ID } from '@/lib/address/types';
import { formatAddress, formatLocality } from '@/lib/address/format';
import type {
  CartLine,
  CartRefreshResult,
  CouponResult,
  PlaceOrderState,
  ResumePaymentResult,
  TrackState,
} from '@/components/order/types';
import type { Coupon, ProductSnapshot } from '@/types/store';

// ---------------------------------------------------------------------------
// Basic abuse protection
//
// A fixed-window counter per client IP, kept in this server instance's memory.
// Limits: it resets on restart/redeploy and is not shared between instances
// (serverless functions, multiple containers). It stops casual scripted abuse
// of a single instance; for real protection put a shared store (Redis/Upstash)
// or the hosting platform's rate limiting in front of these endpoints.
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(scope: string, ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const key = `${scope}:${ip}`;
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > limit;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  return (fwd?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim().slice(0, 64);
}

// ---------------------------------------------------------------------------
// Cart inputs: only product ids and quantities ever come from the client.
// ---------------------------------------------------------------------------

const PRODUCT_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_LINES = 60;

function sanitizeLines(input: unknown): CartLine[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_LINES) return null;
  const merged = new Map<string, number>();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return null;
    const { id, qty } = raw as { id?: unknown; qty?: unknown };
    if (typeof id !== 'string' || !PRODUCT_ID_RE.test(id)) return null;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 99) return null;
    merged.set(id, Math.min(99, (merged.get(id) ?? 0) + qty));
  }
  return [...merged].map(([id, qty]) => ({ id, qty }));
}

/** Fresh price and stock for the products in the shopper's basket. */
export async function refreshCart(ids: string[]): Promise<CartRefreshResult> {
  if (!Array.isArray(ids)) return { ok: false, products: [] };
  const clean = [...new Set(ids.filter((id) => typeof id === 'string' && PRODUCT_ID_RE.test(id)))].slice(0, MAX_LINES);
  if (clean.length === 0) return { ok: true, products: [] };
  try {
    const products = await getProductsByIds(clean);
    const fresh: ProductSnapshot[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      price: p.price,
      oldPrice: p.oldPrice,
      image: p.image,
      stock: p.stock,
    }));
    return { ok: true, products: fresh };
  } catch {
    return { ok: false, products: [] };
  }
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

const COUPON_RE = /^[A-Z0-9_-]{2,30}$/;

async function loadCoupon(code: string): Promise<{ coupon: (Coupon & { startsAt?: string; usageLimit?: number; usedCount: number }) | null }> {
  const { data, error } = await supabaseAdmin().from('coupons').select('*').eq('code', code).maybeSingle();
  if (isMissingTableError(error)) {
    // Demo mode (schema not run yet): validate against the sample coupons so the
    // basket preview works. Orders are refused in this mode anyway.
    const seed = INITIAL_STORE_DATA.coupons.find((c) => c.code.toUpperCase() === code);
    return { coupon: seed ? { ...seed, usedCount: 0 } : null };
  }
  if (error) throw new Error(error.message);
  if (!data) return { coupon: null };
  return {
    coupon: {
      ...toCoupon(data),
      startsAt: data.starts_at ?? undefined,
      usageLimit: data.usage_limit ?? undefined,
      usedCount: Number(data.used_count ?? 0),
    },
  };
}

/**
 * Check a coupon against the database for the given basket. The subtotal is
 * re-computed here from catalog prices; the client only sends ids + qty.
 */
export async function validateCoupon(rawCode: string, lines: CartLine[]): Promise<CouponResult> {
  if (rateLimited('coupon', await clientIp(), 30, 60_000)) {
    return { ok: false, error: 'Too many attempts. Please wait a minute and try again.' };
  }
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  if (!code) return { ok: false, error: 'Enter a coupon code.' };
  if (!COUPON_RE.test(code)) return { ok: false, error: `“${code.slice(0, 30)}” is not a valid coupon code.` };

  const items = sanitizeLines(lines);
  if (!items) return { ok: false, error: 'Add items to your basket before applying a coupon.' };

  try {
    const [{ coupon }, products] = await Promise.all([loadCoupon(code), getProductsByIds(items.map((i) => i.id))]);
    if (!coupon) return { ok: false, error: `Coupon ${code} does not exist.` };

    const now = new Date().toISOString();
    if (!coupon.active) return { ok: false, error: `Coupon ${code} is no longer active.` };
    if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: `Coupon ${code} is not active yet.` };
    if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: `Coupon ${code} has expired.` };
    if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      return { ok: false, error: `Coupon ${code} has reached its usage limit.` };
    }

    const price = new Map(products.map((p) => [p.id, p.price]));
    const subtotal = items.reduce((s, i) => s + (price.get(i.id) ?? 0) * i.qty, 0);
    if (subtotal < coupon.minSubtotal) {
      return {
        ok: false,
        error: `Coupon ${code} needs a subtotal of ${formatBDT(coupon.minSubtotal)} — add ${formatBDT(coupon.minSubtotal - subtotal)} more.`,
      };
    }

    const clean: Coupon = {
      code: coupon.code.toUpperCase(),
      label: coupon.label,
      discountType: coupon.discountType,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      minSubtotal: coupon.minSubtotal,
      active: coupon.active,
      expiresAt: coupon.expiresAt,
    };
    return { ok: true, coupon: clean, discount: discountFor(clean, subtotal) };
  } catch {
    return { ok: false, error: 'We could not check that coupon right now. Please try again.' };
  }
}

// ---------------------------------------------------------------------------
// Place order
// ---------------------------------------------------------------------------

/**
 * Map place_order() exceptions to messages a shopper can act on.
 */
function mapPlaceOrderError(raw: string, couponCode: string | null): Pick<PlaceOrderState, 'message' | 'productId' | 'couponProblem' | 'paymentProblem'> {
  const msg = raw.trim();
  const coupon = couponCode ? `Coupon ${couponCode}` : 'Your coupon';
  if (msg === 'EMPTY_CART') return { message: 'Your basket is empty. Add some items before placing an order.' };
  if (msg === 'INVALID_QTY') return { message: 'One of the quantities in your basket is not valid (1–99 per item). Please review your basket.' };
  if (msg.startsWith('PRODUCT_UNAVAILABLE:')) {
    const productId = msg.slice('PRODUCT_UNAVAILABLE:'.length);
    return {
      productId,
      message: 'An item in your basket is no longer available. Please remove it and try again.',
    };
  }
  if (msg.startsWith('OUT_OF_STOCK:')) {
    const rest = msg.slice('OUT_OF_STOCK:'.length);
    const sep = rest.indexOf(':');
    const stock = Number(rest.slice(0, sep));
    const name = rest.slice(sep + 1) || 'An item';
    return {
      message:
        stock > 0
          ? `Only ${stock} of ${name} left in stock. Please lower the quantity and try again.`
          : `${name} just sold out. Please remove it from your basket and try again.`,
    };
  }
  if (msg === 'COUPON_INVALID') {
    return {
      couponProblem: true,
      message: `${coupon} is no longer valid (it may have expired or reached its usage limit). Remove it to continue.`,
    };
  }
  if (msg.startsWith('COUPON_MIN_SUBTOTAL:')) {
    const min = Number(msg.slice('COUPON_MIN_SUBTOTAL:'.length));
    return {
      couponProblem: true,
      message: `${coupon} needs a subtotal of at least ${formatBDT(Number.isFinite(min) ? min : 0)}. Add more items or remove the coupon.`,
    };
  }
  if (msg === 'PAYMENT_AMOUNT_OUT_OF_RANGE') {
    return { paymentProblem: true, message: 'Online payment needs an order total between ৳10 and ৳5,00,000. Please choose cash on delivery.' };
  }
  if (msg === 'INVALID_PAYMENT_METHOD') return { paymentProblem: true, message: 'Please choose a payment method.' };
  return { message: 'We could not place your order right now. Please try again in a moment.' };
}

/** Remember recent submissions so a double-submit returns the first result instead of a second order. */
const submissions = new Map<string, { at: number; result: PlaceOrderState }>();
const SUBMISSION_TTL = 10 * 60_000;
const SUBMISSION_RE = /^[A-Za-z0-9-]{8,64}$/;

export async function placeOrder(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  const values = readCheckoutInput(formData);
  const echo = { ...values };

  // Honeypot: real shoppers never see or fill this field.
  if (String(formData.get('company') ?? '').trim() !== '') {
    return { status: 'error', message: 'We could not place your order. Please try again.', values: echo };
  }

  const submissionId = String(formData.get('submissionId') ?? '');
  const now = Date.now();
  for (const [k, s] of submissions) if (now - s.at > SUBMISSION_TTL) submissions.delete(k);
  if (SUBMISSION_RE.test(submissionId)) {
    const prior = submissions.get(submissionId);
    if (prior) return prior.result;
  }

  if (rateLimited('order', await clientIp(), 5, 10 * 60_000)) {
    return {
      status: 'error',
      message: 'Too many orders from your connection in a short time. Please wait a few minutes or call us to order.',
      values: echo,
    };
  }

  // Shape checks first, then the address against the Bangladesh dataset:
  // district → upazila/thana → union must exist and belong together. Whether
  // the union is required (upazila) or optional free text (city thana) is
  // decided by the dataset, not the client.
  // Outside Dhaka district goes by courier: no day or slot to check.
  const courier = !!values.district && values.district !== DHAKA_DISTRICT_ID;
  const fieldErrors = validateCheckout(values, { unionOptional: true, courier });
  const place = resolveAddress(values);
  if (!place.ok) {
    for (const [f, msg] of Object.entries(place.errors) as [keyof typeof place.errors, string][]) fieldErrors[f] ??= msg;
  }
  const day = asDeliveryDay(values.day);
  if (!courier && !fieldErrors.slot && !fieldErrors.day && !isSlotAvailable(values.slot, day, now)) {
    fieldErrors.slot = 'That slot is no longer available today. Please pick a later slot or tomorrow.';
  }
  if (Object.keys(fieldErrors).length > 0 || !place.ok) {
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors, values: echo };
  }
  const where = place.value;

  let lines: CartLine[] | null = null;
  try {
    lines = sanitizeLines(JSON.parse(String(formData.get('items') ?? '[]')));
  } catch {
    lines = null;
  }
  if (!lines) {
    return { status: 'error', message: 'Your basket looks empty or invalid. Please review your basket and try again.', values: echo };
  }

  const rawMethod = String(formData.get('paymentMethod') ?? 'cod');
  if (rawMethod !== 'cod' && rawMethod !== 'sslcommerz') {
    return { status: 'error', paymentProblem: true, message: 'Please choose a payment method.', values: echo };
  }
  const online = rawMethod === 'sslcommerz';
  if (online && !isOnlinePaymentEnabled()) {
    return {
      status: 'error',
      paymentProblem: true,
      message: 'Online payment is not available right now. Please choose cash on delivery.',
      values: echo,
    };
  }

  const rawCoupon = String(formData.get('coupon') ?? '').trim().toUpperCase();
  const couponCode = rawCoupon && COUPON_RE.test(rawCoupon) ? rawCoupon : null;

  let userId: string | null = null;
  try {
    userId = (await getCurrentUser())?.id ?? null;
  } catch {
    userId = null;
  }

  const customer = {
    name: values.name,
    phone: normalizePhone(values.phone)!,
    email: values.email || '',
    address: values.address,
    // Kept for older readers: area = upazila/thana, city = district.
    area: where.upazila,
    city: where.district,
    division: where.division,
    district: where.district,
    upazila: where.upazila,
    union: where.union,
    landmark: values.landmark,
    postcode: values.postcode,
    deliverySlot: courier ? COURIER_DELIVERY_TEXT : deliverySlotText(values.slot, day, now),
    notes: values.notes,
  };

  const { data, error } = await supabaseAdmin().rpc('place_order', {
    p_customer: customer,
    p_items: lines.map((l) => ({ productId: l.id, qty: l.qty })),
    p_coupon_code: couponCode,
    p_user_id: userId,
    // Only sent for online orders, so cash-on-delivery keeps working against
    // a database that still has the older 4-argument place_order().
    ...(online ? { p_payment_method: 'sslcommerz' } : {}),
  });

  if (error) {
    if (isMissingTableError(error)) {
      return {
        status: 'unavailable',
        message: 'Online ordering is not available yet — our store is still being set up. Please call us to order.',
        values: echo,
      };
    }
    const mapped = mapPlaceOrderError(error.message ?? '', couponCode);
    if (mapped.message?.startsWith('We could not place')) {
      console.error('[placeOrder] place_order failed:', error.code, error.message);
    }
    return { status: 'error', ...mapped, values: echo };
  }

  const order = data as { id?: string; access_token?: string; payment_tran_id?: string | null } | null;
  if (!order?.id || !order.access_token) {
    console.error('[placeOrder] place_order returned no order id');
    return { status: 'error', message: 'We could not confirm your order. Please call us before trying again.', values: echo };
  }

  // Stock and sold counts changed: refresh the cached catalog.
  updateTag('catalog');

  let result: PlaceOrderState = { status: 'success', orderId: order.id, accessToken: order.access_token };

  if (online) {
    // Open the gateway session with the order as the database stored it
    // (total computed by place_order, never a client value).
    const found = order.payment_tran_id ? await findPaymentOrderById(order.id).catch(() => null) : null;
    const session = found?.state === 'ok' ? await startGatewaySession(found.row) : { ok: false as const, reason: 'order not readable' };
    if (!session.ok) {
      console.error('[placeOrder] SSLCommerz session init failed for', order.id, session.reason);
      // Release the stock again: the order cannot be paid.
      if (order.payment_tran_id) {
        await failOnlinePayment(order.payment_tran_id, 'failed', `session init failed: ${session.reason}`).catch(() => null);
        updateTag('catalog');
      }
      return {
        status: 'error',
        paymentProblem: true,
        message:
          'We could not start the online payment, so the order was cancelled and nothing was charged. Please try again, or choose cash on delivery.',
        values: echo,
      };
    }
    result = { status: 'redirect', orderId: order.id, accessToken: order.access_token, gatewayUrl: session.gatewayUrl };
  } else {
    // Cash on delivery is confirmed now; online orders email once paid.
    const orderId = order.id;
    after(() => sendOrderConfirmation(orderId));
  }

  if (SUBMISSION_RE.test(submissionId)) submissions.set(submissionId, { at: now, result });
  return result;
}

// ---------------------------------------------------------------------------
// Track order
// ---------------------------------------------------------------------------

const NOT_FOUND = 'No order found with that ID and phone number.';

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const id = String(formData.get('orderId') ?? '').trim().toUpperCase().slice(0, 40);
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 30);
  const values = { id, phone };

  const fieldErrors: TrackState['fieldErrors'] = {};
  if (!id) fieldErrors.id = 'Enter your order ID, e.g. FB-240901.';
  if (!phone) fieldErrors.phone = 'Enter the mobile number used for the order.';
  else if (!normalizePhone(phone)) fieldErrors.phone = 'Enter a valid Bangladeshi mobile number.';
  if (fieldErrors.id || fieldErrors.phone) return { status: 'error', fieldErrors, values };

  if (rateLimited('track', await clientIp(), 10, 10 * 60_000)) {
    return { status: 'error', message: 'Too many lookups. Please wait a few minutes and try again.', values };
  }

  try {
    const res = await findOrderByIdAndPhone(id, phone);
    if (res.state === 'unavailable') {
      return { status: 'unavailable', message: 'Order tracking is not available yet. Please call us for an update on your order.', values };
    }
    if (res.state !== 'ok') return { status: 'error', message: NOT_FOUND, values };

    const o = res.order;
    return {
      status: 'found',
      values,
      result: {
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        statusHistory: o.statusHistory ?? [],
        itemCount: o.items.reduce((s, i) => s + i.qty, 0),
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        area: formatLocality(o.customer),
        address: formatAddress(o.customer),
        deliverySlot: o.customer.deliverySlot,
        accessToken: res.accessToken,
      },
    };
  } catch {
    return { status: 'error', message: 'We could not look up your order right now. Please try again.', values };
  }
}

// ---------------------------------------------------------------------------
// Complete payment (order page): new gateway session for the same tran_id
// ---------------------------------------------------------------------------

export async function resumePayment(orderId: string, token: string | null): Promise<ResumePaymentResult> {
  if (typeof orderId !== 'string' || (token !== null && typeof token !== 'string')) {
    return { ok: false, error: 'This order could not be found.' };
  }
  if (rateLimited('resume-payment', await clientIp(), 10, 10 * 60_000)) {
    return { ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
  }
  if (!isOnlinePaymentEnabled()) {
    return { ok: false, error: 'Online payment is not available right now. Please call us to pay on delivery.' };
  }

  try {
    // Same gate as the order page: the access token, or the signed-in owner.
    let userId: string | null = null;
    try {
      userId = (await getCurrentUser())?.id ?? null;
    } catch {
      userId = null;
    }
    const view = await getOrderForViewer(orderId, { token, userId });
    if (view.state !== 'ok') return { ok: false, error: 'This order could not be found.' };

    const found = await findPaymentOrderById(view.order.id);
    if (found.state !== 'ok') return { ok: false, error: 'This order could not be found.' };
    const row = found.row;
    if (row.payment_method !== 'sslcommerz' || row.payment_status !== 'pending' || row.status === 'Cancelled') {
      return { ok: false, error: 'This order is not waiting for an online payment any more. Please refresh the page.' };
    }

    const session = await startGatewaySession(row);
    if (!session.ok) {
      console.error('[resumePayment] SSLCommerz session init failed for', row.id, session.reason);
      return { ok: false, error: 'We could not reach the payment gateway. Please try again in a moment.' };
    }
    return { ok: true, gatewayUrl: session.gatewayUrl };
  } catch {
    return { ok: false, error: 'We could not start the payment right now. Please try again.' };
  }
}
