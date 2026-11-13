import { ADDRESS_LIMITS } from '@/lib/address/types';
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
  /** House / road / flat. */
  address: string;
  /** Address picker ids (see src/lib/address); union may be free text under a city thana. */
  division: string;
  district: string;
  upazila: string;
  union: string;
  landmark: string;
  postcode: string;
  slot: string;
  day: string;
  notes: string;
}

export type CheckoutField = keyof CheckoutInput;
export type FieldErrors = Partial<Record<CheckoutField, string>>;

export const LIMITS = {
  name: 80,
  email: 120,
  address: ADDRESS_LIMITS.address,
  landmark: ADDRESS_LIMITS.landmark,
  notes: 300,
} as const;

/**
 * Context the address picker knows on the client: a city thana has no
 * unions, so the union/area field is optional there. The server decides
 * this itself from the dataset (resolveAddress).
 */
export interface ValidationContext {
  unionOptional?: boolean;
}

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
    address: get('address').replace(/[ \t]+/g, ' '),
    division: get('division'),
    district: get('district'),
    upazila: get('upazila'),
    union: get('union').replace(/\s+/g, ' '),
    landmark: get('landmark').replace(/\s+/g, ' '),
    postcode: get('postcode'),
    slot: get('slot'),
    day: get('day'),
    notes: get('notes'),
  };
}

export function validateField(field: CheckoutField, v: CheckoutInput, ctx: ValidationContext = {}): string | undefined {
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
    case 'division':
      return;
    case 'district':
      if (!v.district) return 'Please choose your district.';
      return;
    case 'upazila':
      if (!v.upazila) return 'Please choose your upazila or thana.';
      return;
    case 'union':
      if (!v.union && !ctx.unionOptional) return 'Please choose your union or town area.';
      if (v.union.length > ADDRESS_LIMITS.areaText) return `Keep the area under ${ADDRESS_LIMITS.areaText} characters.`;
      return;
    case 'landmark':
      if (v.landmark.length > LIMITS.landmark) return `Landmark must be ${LIMITS.landmark} characters or fewer.`;
      return;
    case 'postcode':
      if (v.postcode && !/^\d{4}$/.test(v.postcode)) return 'Post codes in Bangladesh have 4 digits.';
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

export const CHECKOUT_FIELDS: CheckoutField[] = [
  'name',
  'phone',
  'email',
  'division',
  'district',
  'upazila',
  'union',
  'address',
  'landmark',
  'postcode',
  'notes',
  'day',
  'slot',
];

export function validateCheckout(v: CheckoutInput, ctx: ValidationContext = {}): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of CHECKOUT_FIELDS) {
    const e = validateField(f, v, ctx);
    if (e) errors[f] = e;
  }
  return errors;
}

export function asDeliveryDay(v: string): DeliveryDay {
  return v === 'today' ? 'today' : 'tomorrow';
}
