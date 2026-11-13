'use server';

import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';

export interface FormState {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: 'Please enter a valid email address.' };
  const { error } = await supabaseAdmin().from('newsletter_subscribers').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });
  if (isMissingTableError(error)) return { ok: false, message: 'Newsletter is not available yet. Please try again later.' };
  if (error) return { ok: false, message: 'Something went wrong. Please try again.' };
  return { ok: true, message: 'Thanks! You are subscribed.' };
}
