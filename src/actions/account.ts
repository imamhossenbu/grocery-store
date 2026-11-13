'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser, supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { getProductsByIds } from '@/lib/data/catalog';
import { normalizePhone } from '@/lib/format';
import { resolveAddress } from '@/lib/address/geo';
import { ADDRESS_LIMITS } from '@/lib/address/types';
import type { Product } from '@/types/store';

export interface ProfileFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<
    Record<'fullName' | 'phone' | 'address' | 'area' | 'city' | 'division' | 'district' | 'upazila' | 'union' | 'landmark' | 'postcode', string>
  >;
  /** Echo of the form (address parts as picker ids or names). */
  values?: {
    fullName: string;
    phone: string;
    address: string;
    area: string;
    city: string;
    division?: string;
    district?: string;
    upazila?: string;
    union?: string;
    landmark?: string;
    postcode?: string;
  };
}

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Saves the signed-in customer's profile (used to prefill checkout).
 * The row id always comes from the verified session, never from the form.
 */
export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Your session has expired. Please sign in again.' };

  // Address parts come from the AddressPicker as dataset ids (district,
  // upazila/thana, union) and are stored as names after validation.
  const form = {
    fullName: field(formData, 'fullName'),
    phone: field(formData, 'phone'),
    address: field(formData, 'address'),
    division: field(formData, 'division'),
    district: field(formData, 'district'),
    upazila: field(formData, 'upazila'),
    union: field(formData, 'union'),
    landmark: field(formData, 'landmark'),
    postcode: field(formData, 'postcode'),
  };
  const echo = { ...form, area: '', city: '' };

  const fieldErrors: ProfileFormState['fieldErrors'] = {};
  if (form.fullName.length < 2 || form.fullName.length > 80) fieldErrors.fullName = 'Enter your full name (2–80 characters).';

  let phone = '';
  if (form.phone) {
    const normalized = normalizePhone(form.phone);
    if (!normalized) fieldErrors.phone = 'Enter a valid Bangladeshi mobile number, e.g. 01712-345678.';
    else phone = normalized;
  }
  if (form.address.length > ADDRESS_LIMITS.address) fieldErrors.address = `Keep the address under ${ADDRESS_LIMITS.address} characters.`;
  if (form.address && form.address.length < 5) fieldErrors.address = 'Add house, road and flat so our rider can find you.';
  if (form.landmark.length > ADDRESS_LIMITS.landmark) fieldErrors.landmark = `Keep the landmark under ${ADDRESS_LIMITS.landmark} characters.`;
  if (form.postcode && !/^\d{4}$/.test(form.postcode)) fieldErrors.postcode = 'Post codes in Bangladesh have 4 digits.';

  // The address is optional, but if any part is given it must be complete
  // and consistent (each level belongs to its parent in the dataset).
  const hasPlace = !!(form.district || form.upazila || form.union);
  let place: { division: string; district: string; upazila: string; union: string } | null = null;
  if (hasPlace || form.address) {
    const resolved = resolveAddress(form);
    if (resolved.ok) place = resolved.value;
    else Object.assign(fieldErrors, resolved.errors);
    if (!form.address && !fieldErrors.address) fieldErrors.address = 'Add house, road and flat so our rider can find you.';
  }

  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors, values: echo };

  const values = {
    fullName: form.fullName,
    phone,
    address: form.address,
    // Kept for older readers: area = upazila/thana, city = district.
    area: place?.upazila ?? '',
    city: place?.district ?? 'Dhaka',
    division: place?.division ?? '',
    district: place?.district ?? '',
    upazila: place?.upazila ?? '',
    union: place?.union ?? '',
    landmark: place ? form.landmark : '',
    postcode: place ? form.postcode : '',
  };

  // Keep the display name in auth metadata too, so it survives even before
  // the profiles table exists.
  const supabase = await supabaseServer();
  await supabase.auth.updateUser({ data: { full_name: values.fullName } });

  const { error } = await supabaseAdmin()
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: values.fullName,
        phone,
        address: values.address,
        area: values.area,
        city: values.city,
        division: values.division || null,
        district: values.district || null,
        upazila: values.upazila || null,
        union_name: values.union || null,
        landmark: values.landmark || null,
        postcode: values.postcode || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (isMissingTableError(error)) {
    return {
      ok: false,
      message: 'Your name was saved, but address details can’t be stored until our database setup is finished. Please try again later.',
      values: { ...echo, phone: phone || form.phone },
    };
  }
  if (error) return { ok: false, message: 'We couldn’t save your profile. Please try again.', values: echo };

  return { ok: true, message: 'Profile saved. Checkout will now be filled in for you.', values };
}

/**
 * Fresh price / stock for the wishlist (which lives in localStorage).
 * Public catalog data only; ids are validated and capped.
 */
export async function getWishlistProducts(ids: unknown): Promise<Product[]> {
  if (!Array.isArray(ids)) return [];
  const clean = Array.from(
    new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 120))
  ).slice(0, 100);
  if (!clean.length) return [];
  try {
    return await getProductsByIds(clean);
  } catch {
    return [];
  }
}

/**
 * Current price / stock for a set of product ids (reorder, buy again).
 * Public catalog data only — same validation as getWishlistProducts.
 */
export async function getCurrentProducts(ids: unknown): Promise<Product[]> {
  return getWishlistProducts(ids);
}

/** Revoke every session of the signed-in user (all devices), then go to /login. */
export async function signOutEverywhere(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut({ scope: 'global' });
  redirect('/login');
}
