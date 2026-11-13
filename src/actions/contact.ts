'use server';

import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/format';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { CONTACT_SUBJECTS } from '@/components/info/contact-subjects';

export interface ContactFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<'name' | 'email' | 'phone' | 'subject' | 'message', string>>;
  values?: { name: string; email: string; phone: string; subject: string; orderId: string; message: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === 'string' ? v.trim() : '';
}

export async function submitContactMessage(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Honeypot: real visitors never see or fill this field. Pretend success so
  // bots don't learn to avoid it.
  if (field(formData, 'website')) {
    return { ok: true, message: 'Thanks! Your message has reached our support team.' };
  }

  const values = {
    name: field(formData, 'name').replace(/\s+/g, ' '),
    email: field(formData, 'email').toLowerCase(),
    phone: field(formData, 'phone'),
    subject: field(formData, 'subject'),
    orderId: field(formData, 'orderId').toUpperCase(),
    message: field(formData, 'message'),
  };

  const fieldErrors: ContactFormState['fieldErrors'] = {};
  if (values.name.length < 2 || values.name.length > 80) fieldErrors.name = 'Enter your name (2–80 characters).';
  if (!EMAIL_RE.test(values.email) || values.email.length > 200) fieldErrors.email = 'Enter a valid email address.';
  let phone: string | null = null;
  if (values.phone) {
    phone = normalizePhone(values.phone);
    if (!phone) fieldErrors.phone = 'Enter a valid Bangladeshi mobile number or leave it blank.';
  }
  if (!(CONTACT_SUBJECTS as readonly string[]).includes(values.subject)) fieldErrors.subject = 'Choose a topic.';
  if (values.orderId && !/^FB-\d{6}$/.test(values.orderId)) values.orderId = '';
  if (values.message.length < 10) fieldErrors.message = 'Tell us a little more (at least 10 characters).';
  else if (values.message.length > 2000) fieldErrors.message = 'Keep your message under 2,000 characters.';

  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors, values };

  const subject = values.orderId ? `${values.subject} · ${values.orderId}` : values.subject;
  const { error } = await supabaseAdmin().from('contact_messages').insert({
    name: values.name,
    email: values.email,
    phone,
    subject,
    message: values.message,
  });

  if (isMissingTableError(error)) {
    return {
      ok: false,
      message: `Our online inbox isn’t open yet. Please call ${SUPPORT_PHONE} or email ${SUPPORT_EMAIL} — we’ll be glad to help.`,
      values,
    };
  }
  if (error) return { ok: false, message: 'We couldn’t send your message. Please try again in a moment.', values };

  return {
    ok: true,
    message: `Thanks, ${values.name.split(' ')[0]}! Your message has reached our support team. We reply within a few hours between 7 AM and 11 PM.`,
  };
}
