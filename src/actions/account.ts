'use server';

import { getCurrentUser, supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { getProductsByIds } from '@/lib/data/catalog';
import { normalizePhone } from '@/lib/format';
import { DHAKA_AREAS } from '@/lib/constants';
import type { Product } from '@/types/store';

export interface ProfileFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<'fullName' | 'phone' | 'address' | 'area' | 'city', string>>;
  values?: { fullName: string; phone: string; address: string; area: string; city: string };
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

  const values = {
    fullName: field(formData, 'fullName'),
    phone: field(formData, 'phone'),
    address: field(formData, 'address'),
    area: field(formData, 'area'),
    city: field(formData, 'city') || 'Dhaka',
  };

  const fieldErrors: ProfileFormState['fieldErrors'] = {};
  if (values.fullName.length < 2 || values.fullName.length > 80) fieldErrors.fullName = 'Enter your full name (2–80 characters).';

  let phone = '';
  if (values.phone) {
    const normalized = normalizePhone(values.phone);
    if (!normalized) fieldErrors.phone = 'Enter a valid Bangladeshi mobile number, e.g. 01712-345678.';
    else phone = normalized;
  }
  if (values.address.length > 200) fieldErrors.address = 'Keep the address under 200 characters.';
  if (values.address && values.address.length < 5) fieldErrors.address = 'Add house, road and block so our rider can find you.';
  if (values.area && !(DHAKA_AREAS as readonly string[]).includes(values.area)) fieldErrors.area = 'Choose an area from the list.';
  if (values.city.length > 60 || !/^[\p{L} .'-]+$/u.test(values.city)) fieldErrors.city = 'Enter a valid city.';

  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors, values };

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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (isMissingTableError(error)) {
    return {
      ok: false,
      message: 'Your name was saved, but address details can’t be stored until our database setup is finished. Please try again later.',
      values: { ...values, phone: phone || values.phone },
    };
  }
  if (error) return { ok: false, message: 'We couldn’t save your profile. Please try again.', values };

  return { ok: true, message: 'Profile saved. Checkout will now be filled in for you.', values: { ...values, phone } };
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
