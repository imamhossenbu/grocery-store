'use client';

import { startTransition, useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Loader2,
  ShieldCheck,
  Lock,
  MapPin,
  Phone,
  ShoppingBasket,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { placeOrder } from '@/actions/orders';
import { EmptyState } from '@/components/ui/EmptyState';
import { CouponBox } from '@/components/cart/CouponBox';
import { CartNotices } from '@/components/cart/CartNotices';
import { FreeDeliveryProgress, TotalsRows } from '@/components/cart/OrderTotals';
import { useCartSync } from '@/components/cart/useCartSync';
import { DELIVERY_DAYS, deliveryDateLabel, isSlotAvailable, type DeliveryDay } from '@/components/order/delivery';
import { CHECKOUT_FIELDS, LIMITS, validateCheckout, validateField, type CheckoutField, type CheckoutInput, type FieldErrors } from '@/components/order/validation';
import type { PlaceOrderState } from '@/components/order/types';
import { DELIVERY_SLOTS, SUPPORT_PHONE } from '@/lib/constants';
import { AddressPicker, type AddressErrorField, type AddressErrors } from '@/components/address/AddressPicker';
import { DHAKA_DISTRICT_ID, type AddressValue, type GeoIndex, type LocalityKind } from '@/lib/address/types';
import { OUTSIDE_DHAKA_DELIVERY_FEE, deliveryFeeFor } from '@/lib/pricing';
import { formatBDT } from '@/lib/format';
import type { Coupon, Profile } from '@/types/store';
import { CheckoutSkeleton } from './CheckoutSkeleton';

const INITIAL: PlaceOrderState = { status: 'idle' };

// Current time, read only on the client (null during server render) and
// refreshed every minute so same-day slots grey out as they close.
const subscribeMinute = (cb: () => void) => {
  const t = window.setInterval(cb, 60_000);
  return () => window.clearInterval(t);
};
const getMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const getServerMinute = () => null;

const FIELD_ORDER: CheckoutField[] = CHECKOUT_FIELDS;
const ADDRESS_FIELDS: AddressErrorField[] = ['division', 'district', 'upazila', 'union', 'address', 'landmark', 'postcode'];

/** Focus the control for a field: picker lists expose data-field, inputs a name. */
function focusField(root: HTMLElement | null, f: string) {
  root?.querySelector<HTMLElement>(`[data-field="${f}"], [name="${f}"]:not([type="hidden"])`)?.focus();
}

interface Props {
  live: boolean;
  signedIn: boolean;
  email: string | null;
  profile: Profile | null;
  coupons: Coupon[];
  /** SSLCommerz credentials are configured on the server. */
  onlinePayment: boolean;
  /** Divisions + districts for the address picker. */
  geo: GeoIndex;
}

type PaymentChoice = 'cod' | 'sslcommerz';

export function CheckoutForm({ live, signedIn, email, profile, coupons, onlinePayment, geo }: Props) {
  const router = useRouter();
  const { hydrated, cart, cartCount, subtotal, discount, coupon, setCoupon, clearCart, toast } = useShop();
  const { checking, notices, dismissNotices } = useCartSync();
  const [state, formAction, pending] = useActionState(placeOrder, INITIAL);
  const now = useSyncExternalStore(subscribeMinute, getMinute, getServerMinute);

  const [values, setValues] = useState<CheckoutInput>(() => ({
    name: profile?.fullName ?? '',
    phone: profile?.phone ?? '',
    email: email ?? '',
    address: profile?.address ?? '',
    division: '',
    district: '',
    upazila: '',
    union: '',
    landmark: profile?.landmark ?? '',
    postcode: profile?.postcode ?? '',
    slot: '',
    day: '',
    notes: '',
  }));
  // The basket shows the Dhaka fee; once a district is chosen the fee follows it.
  const outsideDhaka = !!values.district && values.district !== DHAKA_DISTRICT_ID;
  const deliveryFee = deliveryFeeFor(subtotal, { outsideDhaka });
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentChoice>('cod');
  // Saved profile address as names; the picker matches them to the dataset.
  const [addressDefault] = useState(() => ({
    division: profile?.division,
    district: profile?.district ?? '',
    upazila: profile?.upazila ?? profile?.area ?? '',
    union: profile?.union ?? '',
    city: profile?.area ? profile.city : undefined,
    address: profile?.address ?? '',
    landmark: profile?.landmark ?? '',
    postcode: profile?.postcode ?? '',
  }));
  const [localityKind, setLocalityKind] = useState<LocalityKind | undefined>();
  const submissionId = useRef<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<PlaceOrderState | null>(null);

  // Effective day/slot: the shopper's choice, else the earliest bookable one.
  const defaultDay: DeliveryDay = now !== null && DELIVERY_SLOTS.some((s) => isSlotAvailable(s.id, 'today', now)) ? 'today' : 'tomorrow';
  const day: DeliveryDay = values.day === 'today' || values.day === 'tomorrow' ? values.day : defaultDay;
  const firstSlot = now === null ? DELIVERY_SLOTS[0].id : DELIVERY_SLOTS.find((s) => isSlotAvailable(s.id, day, now))?.id ?? '';
  const slot = values.slot || firstSlot;

  // React to the Server Action's result once per result object.
  useEffect(() => {
    if (state === INITIAL || handled.current === state) return;
    handled.current = state;
    if (state.status === 'success' && state.orderId && state.accessToken) {
      clearCart();
      router.replace(`/order/${encodeURIComponent(state.orderId)}?token=${encodeURIComponent(state.accessToken)}&placed=1`);
      return;
    }
    if (state.status === 'redirect' && state.gatewayUrl) {
      // The order exists and its stock is reserved: empty the basket, then
      // leave for the SSLCommerz hosted payment page.
      clearCart();
      window.location.assign(state.gatewayUrl);
      return;
    }
    Promise.resolve().then(() => {
      setServerErrors(state.fieldErrors ?? {});
      const firstBad = FIELD_ORDER.find((f) => state.fieldErrors?.[f]);
      if (firstBad) {
        focusField(formRef.current, firstBad);
      } else {
        alertRef.current?.focus();
      }
    });
  }, [state, clearCart, router]);

  if (!hydrated || state.status === 'success' || state.status === 'redirect') {
    if (state.status === 'redirect') return <Redirecting online />;
    return state.status === 'success' ? <Redirecting /> : <CheckoutSkeleton />;
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <CartNotices notices={notices} onDismiss={dismissNotices} />
        <EmptyState
          icon={<ShoppingBasket className="h-8 w-8" />}
          title="Your basket is empty"
          description="Add some fresh groceries to your basket before checking out."
          actionLabel="Browse the shop"
          actionHref="/shop"
        />
      </div>
    );
  }

  const errorFor = (f: CheckoutField) => serverErrors[f] ?? (touched[f] ? clientErrors[f] : undefined);

  const ctx = { unionOptional: localityKind === 'thana' };

  const update = (f: CheckoutField, v: string) => {
    const next = { ...values, [f]: v };
    setValues(next);
    if (touched[f]) setClientErrors((e) => ({ ...e, [f]: validateField(f, next, ctx) }));
    if (serverErrors[f]) setServerErrors((e) => ({ ...e, [f]: undefined }));
  };

  const blur = (f: CheckoutField) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setClientErrors((e) => ({ ...e, [f]: validateField(f, values, ctx) }));
  };

  // The picker reports every change; re-check touched fields and clear
  // server errors for the parts that changed.
  const onAddressChange = (addr: AddressValue, kind: LocalityKind | undefined) => {
    setLocalityKind(kind);
    const next = { ...values, ...addr };
    const changed = ADDRESS_FIELDS.filter((f) => values[f] !== next[f]);
    if (!changed.length) return;
    setValues(next);
    const c = { unionOptional: kind === 'thana' };
    setClientErrors((e) => {
      const out = { ...e };
      for (const f of ADDRESS_FIELDS) if (touched[f] || e[f]) out[f] = validateField(f, next, c);
      return out;
    });
    setServerErrors((e) => {
      const out = { ...e };
      for (const f of changed) out[f] = undefined;
      return out;
    });
  };

  const addressErrors: AddressErrors = Object.fromEntries(ADDRESS_FIELDS.map((f) => [f, errorFor(f)]).filter(([, m]) => m));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending || !live) return;

    const effective = { ...values, day, slot };
    const errs = validateCheckout(effective, ctx);
    if (!errs.slot && now !== null && !isSlotAvailable(slot, day, now)) {
      errs.slot = 'That slot is no longer available today. Please pick another slot or tomorrow.';
    }
    setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));
    setClientErrors(errs);
    setServerErrors({});
    const firstBad = FIELD_ORDER.find((f) => errs[f]);
    if (firstBad) {
      focusField(e.currentTarget, firstBad);
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set('day', day);
    fd.set('slot', slot);
    fd.set('items', JSON.stringify(cart.map((i) => ({ id: i.id, qty: i.qty }))));
    fd.set('coupon', coupon && subtotal >= coupon.minSubtotal ? coupon.code : '');
    fd.set('paymentMethod', onlinePayment ? payment : 'cod');
    submissionId.current ??= crypto.randomUUID();
    fd.set('submissionId', submissionId.current);
    startTransition(() => formAction(fd));
  };

  const problemName = state.productId ? cart.find((i) => i.id === state.productId)?.name : undefined;
  const showAlert = state.status === 'error' || state.status === 'unavailable';

  const submitButton = (extra: string) => (
    <button
      type="submit"
      form="checkout-form"
      disabled={pending || !live || checking}
      aria-disabled={pending || !live || checking}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-emerald-gradient px-6 py-4 text-base font-bold text-white shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${extra}`}
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {payment === 'sslcommerz' ? 'Starting secure payment…' : 'Placing your order…'}
        </>
      ) : payment === 'sslcommerz' ? (
        <>
          <Lock className="h-4 w-4" aria-hidden /> Pay {formatBDT(total)} online
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" aria-hidden /> Place order · {formatBDT(total)}
        </>
      )}
    </button>
  );

  const summary = (
    <div className="space-y-4">
      <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {cart.map((item) => (
          <li key={item.id} className={`flex items-center gap-3 rounded-2xl ${item.id === state.productId ? 'bg-red-50 p-1.5 ring-1 ring-red-200' : ''}`}>
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-14 w-14 rounded-xl bg-[#f0f7f2] object-cover" />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#0f2c1d] px-1 text-[10px] font-bold text-white">{item.qty}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-bold text-[#112a1d]">{item.name}</span>
              <span className="block text-xs text-[#5a7165]">{item.unit} · {formatBDT(item.price)}</span>
            </span>
            <span className="text-sm font-extrabold tabular-nums text-[#112a1d]">{formatBDT(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>
      <Link href="/cart" className="inline-block text-xs font-bold text-[#1a663b] hover:underline">Edit basket</Link>
      <CouponBox coupons={coupons} compact />
      <TotalsRows subtotal={subtotal} discount={discount} couponCode={coupon?.code} deliveryFee={deliveryFee} total={total} itemCount={cartCount} />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
      {/* Mobile: collapsible summary above the form */}
      <div className="lg:hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          aria-controls="mobile-summary"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-[#14522f]">
            <ShoppingBasket className="h-4 w-4" aria-hidden />
            {summaryOpen ? 'Hide' : 'Show'} order summary ({cartCount})
            <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} aria-hidden />
          </span>
          <span className="font-display text-lg font-bold text-[#112a1d]">{formatBDT(total)}</span>
        </button>
        {summaryOpen && (
          <div id="mobile-summary" className="border-t border-[#eef5f0] px-5 py-4">
            {summary}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <CartNotices notices={notices} onDismiss={dismissNotices} />

        {!live && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Online ordering is not available yet</p>
              <p className="mt-0.5">
                Our store is still being set up, so orders can&apos;t be placed on the website right now. Please call{' '}
                <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`} className="font-bold underline">{SUPPORT_PHONE}</a> to order.
              </p>
            </div>
          </div>
        )}

        {showAlert && state.message && (
          <div
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="space-y-2">
              <p className="font-semibold">
                {problemName ? state.message.replace('An item in your basket', problemName) : state.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {state.paymentProblem && payment !== 'cod' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayment('cod');
                      toast('Cash on delivery selected', 'You can place your order now.', 'info');
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100 cursor-pointer"
                  >
                    Switch to cash on delivery
                  </button>
                )}
                {state.couponProblem && coupon && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      toast('Coupon removed', 'You can place your order now.', 'info');
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100 cursor-pointer"
                  >
                    Remove coupon
                  </button>
                )}
                {(state.productId || state.message.includes('stock') || state.message.includes('sold out')) && (
                  <Link href="/cart" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100">
                    Review basket
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <form id="checkout-form" ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={pending}>
          {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
          <div className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label>
              Company
              <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>

          <Section step={1} title="Contact details" icon={<UserRound className="h-5 w-5" aria-hidden />}>
            {signedIn ? (
              <p className="mb-4 rounded-xl bg-[#f0f9f3] px-3 py-2 text-xs font-semibold text-[#14522f]">
                You&apos;re signed in{email ? ` as ${email}` : ''}. {profile ? 'We filled in your saved details.' : ''}{' '}
                <Link href="/account" className="underline">Manage profile</Link>
              </p>
            ) : (
              <p className="mb-4 text-xs text-[#5a7165]">
                Have an account?{' '}
                <Link href="/login?next=/checkout" className="font-bold text-[#1a663b] hover:underline">Sign in</Link>{' '}
                to use your saved address and see this order in your account.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Full name"
                name="name"
                value={values.name}
                error={errorFor('name')}
                onChange={(v) => update('name', v)}
                onBlur={() => blur('name')}
                autoComplete="name"
                maxLength={LIMITS.name}
                required
                className="sm:col-span-2"
              />
              <TextField
                label="Mobile number"
                name="phone"
                type="tel"
                inputMode="tel"
                value={values.phone}
                error={errorFor('phone')}
                onChange={(v) => update('phone', v)}
                onBlur={() => blur('phone')}
                autoComplete="tel"
                placeholder="01XXX-XXXXXX"
                hint="Our rider will call this number on delivery."
                maxLength={20}
                required
              />
              <TextField
                label="Email"
                optional
                name="email"
                type="email"
                inputMode="email"
                value={values.email}
                error={errorFor('email')}
                onChange={(v) => update('email', v)}
                onBlur={() => blur('email')}
                autoComplete="email"
                hint="For your order receipt."
                maxLength={LIMITS.email}
              />
            </div>
          </Section>

          <Section step={2} title="Delivery address" icon={<MapPin className="h-5 w-5" aria-hidden />}>
            <AddressPicker
              idPrefix="checkout-addr"
              index={geo}
              defaultValue={addressDefault}
              errors={addressErrors}
              onChange={(addr, meta) => onAddressChange(addr, meta.kind)}
              onFieldBlur={(f) => blur(f)}
            />
            <TextAreaField
              label="Delivery notes"
              optional
              name="notes"
              value={values.notes}
              error={errorFor('notes')}
              onChange={(v) => update('notes', v)}
              onBlur={() => blur('notes')}
              placeholder="Gate instructions, preferred call time…"
              maxLength={LIMITS.notes}
              className="mt-5"
            />
          </Section>

          <Section step={3} title="Delivery time" icon={<CalendarDays className="h-5 w-5" aria-hidden />}>
            <fieldset>
              <legend className="text-sm font-bold text-[#112a1d]">Day</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {DELIVERY_DAYS.map((d) => {
                  const anyOpen = now === null || DELIVERY_SLOTS.some((s) => isSlotAvailable(s.id, d, now));
                  return (
                    <label
                      key={d}
                      className={`relative flex cursor-pointer flex-col rounded-2xl border-2 px-4 py-3 transition has-focus-visible:ring-2 has-focus-visible:ring-[#1a663b]/40 ${
                        day === d ? 'border-[#1a663b] bg-[#f0f9f3]' : 'border-[#dfece3] bg-white hover:border-[#9ac7ac]'
                      } ${!anyOpen ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type="radio"
                        name="day"
                        value={d}
                        checked={day === d}
                        disabled={!anyOpen}
                        onChange={() => {
                          setValues((v) => ({ ...v, day: d, slot: now !== null && v.slot && !isSlotAvailable(v.slot, d, now) ? '' : v.slot }));
                          setServerErrors((e) => ({ ...e, day: undefined, slot: undefined }));
                          setClientErrors((e) => ({ ...e, day: undefined, slot: undefined }));
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-extrabold capitalize text-[#112a1d]">{d}</span>
                      <span className="text-xs text-[#5a7165]">
                        {now === null ? ' ' : anyOpen ? deliveryDateLabel(d, now) : 'All slots closed'}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errorFor('day') && <p className="mt-1.5 text-xs font-semibold text-red-600" role="alert">{errorFor('day')}</p>}
            </fieldset>

            <fieldset className="mt-5" aria-describedby={errorFor('slot') ? 'slot-error' : undefined}>
              <legend className="text-sm font-bold text-[#112a1d]">Time slot</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {DELIVERY_SLOTS.map((s) => {
                  const available = now === null || isSlotAvailable(s.id, day, now);
                  const selected = slot === s.id && available;
                  return (
                    <label
                      key={s.id}
                      className={`relative flex cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 transition has-focus-visible:ring-2 has-focus-visible:ring-[#1a663b]/40 sm:flex-col sm:items-start ${
                        selected ? 'border-[#1a663b] bg-[#f0f9f3] shadow-soft' : 'border-[#dfece3] bg-white hover:border-[#9ac7ac]'
                      } ${!available ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={s.id}
                        checked={selected}
                        disabled={!available}
                        onChange={() => {
                          setValues((v) => ({ ...v, slot: s.id }));
                          setServerErrors((e) => ({ ...e, slot: undefined }));
                          setClientErrors((e) => ({ ...e, slot: undefined }));
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-extrabold text-[#112a1d]">{s.label}</span>
                      <span className="text-xs font-semibold text-[#5a7165]">{available ? s.time : 'Closed for today'}</span>
                    </label>
                  );
                })}
              </div>
              {errorFor('slot') && <p id="slot-error" className="mt-1.5 text-xs font-semibold text-red-600" role="alert">{errorFor('slot')}</p>}
            </fieldset>
          </Section>

          <Section step={4} title="Payment" icon={<Banknote className="h-5 w-5" aria-hidden />}>
            <fieldset>
              <legend className="sr-only">Payment method</legend>
              <div className="grid gap-3">
                <PaymentOption
                  value="cod"
                  checked={payment === 'cod'}
                  onSelect={() => setPayment('cod')}
                  icon={<Banknote className="h-5 w-5" aria-hidden />}
                  title="Cash on delivery"
                  description="Pay in cash when your groceries arrive."
                />
                <PaymentOption
                  value="sslcommerz"
                  checked={payment === 'sslcommerz'}
                  onSelect={() => setPayment('sslcommerz')}
                  disabled={!onlinePayment}
                  icon={<Smartphone className="h-5 w-5" aria-hidden />}
                  title="Pay online (bKash, Nagad, card…)"
                  description={
                    onlinePayment
                      ? 'Secure payment through SSLCommerz. You will be taken to their payment page.'
                      : 'Online payment is temporarily unavailable.'
                  }
                  badges={PAY_BADGES}
                />
              </div>
              {payment === 'sslcommerz' && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[#f0f9f3] px-3 py-2.5 text-xs text-[#14522f]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Your basket is reserved while you pay. If the payment fails or you cancel, the order is cancelled and you can try again or
                    choose cash on delivery. We never see your card or wallet PIN.
                  </span>
                </p>
              )}
            </fieldset>
          </Section>

          <div className="lg:hidden space-y-3">
            {submitButton('')}
            <TrustLine />
          </div>
        </form>
      </div>

      {/* Desktop: sticky summary */}
      <aside aria-label="Order summary" className="hidden lg:block lg:sticky lg:top-44 space-y-4">
        {outsideDhaka ? (
          <p className="rounded-2xl border border-[#d5eadc] bg-[#f4f9f5] p-4 text-sm font-semibold text-[#14522f]">
            Courier delivery outside Dhaka is a flat {formatBDT(OUTSIDE_DHAKA_DELIVERY_FEE)}.
          </p>
        ) : (
          <FreeDeliveryProgress subtotal={subtotal} />
        )}
        <div className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-xl font-bold text-[#112a1d]">Order summary</h2>
          {summary}
          <div className="mt-5 space-y-3">
            {submitButton('')}
            <TrustLine />
          </div>
        </div>
      </aside>
    </div>
  );
}

function TrustLine() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#5a7165]">
      <Phone className="h-3.5 w-3.5 text-[#1a663b]" aria-hidden /> We&apos;ll call to confirm · Final prices are checked when you order
    </p>
  );
}

function Redirecting({ online = false }: { online?: boolean }) {
  return (
    <div role="status" className="grid place-items-center rounded-3xl border border-[#dfece3] bg-white px-6 py-20 text-center shadow-soft">
      <Loader2 className="h-8 w-8 animate-spin text-[#1a663b]" aria-hidden />
      <p className="mt-4 font-display text-2xl font-bold text-[#112a1d]">{online ? 'Order reserved!' : 'Order placed!'}</p>
      <p className="mt-1 text-sm text-[#5a7165]">
        {online ? 'Taking you to the secure SSLCommerz payment page…' : 'Taking you to your order confirmation…'}
      </p>
    </div>
  );
}

function Section({ step, title, icon, children }: { step: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-6">
      <h2 id={id} className="mb-4 flex items-center gap-3 font-display text-xl font-bold text-[#112a1d]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8f5ee] text-[#1a663b]">{icon}</span>
        <span>
          <span className="block font-sans text-[11px] font-extrabold uppercase tracking-widest text-[#5a7165]">Step {step}</span>
          {title}
        </span>
      </h2>
      {children}
    </section>
  );
}

const INPUT =
  'w-full rounded-2xl border bg-[#f9fbf9] px-4 py-3 text-sm text-[#112a1d] placeholder:text-[#8aa595] transition focus:bg-white focus:outline-none focus:ring-2';
const inputState = (error?: string) =>
  error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-[#cfe3d6] focus:border-[#1a663b] focus:ring-[#1a663b]/20';

interface FieldBase {
  label: string;
  name: CheckoutField;
  value: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
  className?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}

function FieldShell({ id, label, error, hint, optional, className = '', children }: { id: string; label: string; error?: string; hint?: string; optional?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-bold text-[#112a1d]">
        {label}
        {optional && <span className="text-xs font-medium text-[#8aa595]">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#5a7165]">{hint}</p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

function TextField({
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  ...f
}: FieldBase & { type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; autoComplete?: string; placeholder?: string; maxLength?: number }) {
  const id = useId();
  return (
    <FieldShell id={id} label={f.label} error={f.error} hint={f.hint} optional={f.optional} className={f.className}>
      <input
        id={id}
        name={f.name}
        type={type}
        inputMode={inputMode}
        value={f.value}
        onChange={(e) => f.onChange(e.target.value)}
        onBlur={f.onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        required={f.required}
        aria-required={f.required}
        aria-invalid={!!f.error}
        aria-describedby={describedBy(id, f.error, f.hint)}
        className={`${INPUT} ${inputState(f.error)}`}
      />
    </FieldShell>
  );
}

function TextAreaField({ placeholder, maxLength, ...f }: FieldBase & { placeholder?: string; maxLength: number }) {
  const id = useId();
  return (
    <FieldShell id={id} label={f.label} error={f.error} hint={f.hint ?? `${f.value.length}/${maxLength}`} optional={f.optional} className={f.className}>
      <textarea
        id={id}
        name={f.name}
        rows={3}
        value={f.value}
        onChange={(e) => f.onChange(e.target.value)}
        onBlur={f.onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!f.error}
        aria-describedby={describedBy(id, f.error, f.hint ?? 'count')}
        className={`${INPUT} ${inputState(f.error)} resize-y`}
      />
    </FieldShell>
  );
}

const PAY_BADGES = ['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard', 'Amex', 'Net banking'];

function PaymentOption({
  value,
  checked,
  onSelect,
  disabled = false,
  icon,
  title,
  description,
  badges,
}: {
  value: PaymentChoice;
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  badges?: string[];
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition has-focus-visible:ring-2 has-focus-visible:ring-[#1a663b]/40 ${
        checked ? 'border-[#1a663b] bg-[#f0f9f3]' : 'border-[#e3ede6] bg-[#fbfdfb] hover:border-[#9ac7ac]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="h-4 w-4 accent-[#1a663b]"
      />
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${checked ? 'bg-white text-[#1a663b]' : 'bg-[#eef3ef] text-[#7e9688]'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-[#112a1d]">{title}</span>
        <span className="block text-xs text-[#5a7165]">{description}</span>
        {badges && (
          <span className="mt-1.5 flex flex-wrap gap-1" aria-label={`Accepted: ${badges.join(', ')}`}>
            {badges.map((b) => (
              <span key={b} className="rounded-md border border-[#dfece3] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#445c50]" aria-hidden>
                {b}
              </span>
            ))}
          </span>
        )}
      </span>
      {value === 'sslcommerz' && <CreditCard className="hidden h-5 w-5 text-[#7e9688] sm:block" aria-hidden />}
    </label>
  );
}
