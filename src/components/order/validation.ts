import { DHAKA_AREAS } from '@/lib/constants';
import { normalizePhone } from '@/lib/format';
import { DELIVERY_DAYS, findSlot, type DeliveryDay } from './delivery';

/**
 * Checkout field rules, shared by the client form (instant feedback) and the
 * placeOrder Server Action (the authority).
 */

export interface CheckoutInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  slot: string;
  day: string;
  notes: string;
}

export type CheckoutField = keyof CheckoutInput;
export type FieldErrors = Partial<Record<CheckoutField, string>>;

export const LIMITS = {
  name: 80,
  email: 120,
  address: 200,
  city: 40,
  notes: 300,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function readCheckoutInput(fd: FormData): CheckoutInput {
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === 'string' ? v.trim() : '';
  };
  return {
    name: get('name').replace(/\s+/g, ' '),
    phone: get('phone'),
    email: get('email').toLowerCase(),
    address: get('address'),
    area: get('area'),
    city: get('city') || 'Dhaka',
    slot: get('slot'),
    day: get('day'),
    notes: get('notes'),
  };
}

export function validateField(field: CheckoutField, v: CheckoutInput): string | undefined {
  switch (field) {
    case 'name':
      if (v.name.length < 2) return 'Please enter your full name.';
      if (v.name.length > LIMITS.name) return `Name must be ${LIMITS.name} characters or fewer.`;
      return;
    case 'phone':
      if (!v.phone) return 'Please enter your mobile number.';
      if (!normalizePhone(v.phone)) return 'Enter a valid Bangladeshi mobile number, e.g. 01712-345678.';
      return;
    case 'email':
      if (!v.email) return;
      if (v.email.length > LIMITS.email || !EMAIL_RE.test(v.email)) return 'Enter a valid email address or leave it blank.';
      return;
    case 'address':
      if (v.address.length < 5) return 'Please enter your house, road and flat details.';
      if (v.address.length > LIMITS.address) return `Address must be ${LIMITS.address} characters or fewer.`;
      return;
    case 'area':
      if (!(DHAKA_AREAS as readonly string[]).includes(v.area)) return 'Please choose your delivery area.';
      return;
    case 'city':
      if (v.city.length < 2 || v.city.length > LIMITS.city) return 'Please enter your city.';
      return;
    case 'slot':
      if (!findSlot(v.slot)) return 'Please choose a delivery slot.';
      return;
    case 'day':
      if (!(DELIVERY_DAYS as readonly string[]).includes(v.day)) return 'Please choose a delivery day.';
      return;
    case 'notes':
      if (v.notes.length > LIMITS.notes) return `Notes must be ${LIMITS.notes} characters or fewer.`;
      return;
  }
}

const FIELDS: CheckoutField[] = ['name', 'phone', 'email', 'address', 'area', 'city', 'day', 'slot', 'notes'];

export function validateCheckout(v: CheckoutInput): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of FIELDS) {
    const e = validateField(f, v);
    if (e) errors[f] = e;
  }
  return errors;
}

export function asDeliveryDay(v: string): DeliveryDay {
  return v === 'today' ? 'today' : 'tomorrow';
}
