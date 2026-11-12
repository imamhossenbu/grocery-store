'use client';

import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitContactMessage, type ContactFormState } from '@/actions/contact';
import { FieldFooter, FieldLabel, FormAlert, inputClass, SubmitButton, TextField } from '@/components/account/FormControls';
import { CONTACT_SUBJECTS } from './contact-subjects';

const initial: ContactFormState = { ok: false, message: '' };

const ok = 'border-[#d3e5da] focus:border-[#1a663b] focus:ring-[#1a663b]/10';
const bad = 'border-red-300 focus:border-red-500 focus:ring-red-100';

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactMessage, initial);
  const v = state.values;
  const err = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-center rounded-3xl bg-[#effaf3] px-6 py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#1a663b]" />
        <h3 className="mt-4 font-display text-2xl font-bold text-[#112a1d]">Message sent</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#445c50]">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Honeypot — hidden from people and assistive tech, attractive to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" autoComplete="name" required maxLength={80} defaultValue={v?.name} error={err.name} />
        <TextField label="Email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={200} defaultValue={v?.email} error={err.email} />
        <TextField label="Mobile number" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" optional placeholder="01XXXXXXXXX" maxLength={20} defaultValue={v?.phone} error={err.phone} />
        <TextField label="Order number" name="orderId" optional placeholder="FB-123456" maxLength={9} defaultValue={v?.orderId} hint="Helps us find your order faster." />
      </div>

      <div>
        <FieldLabel htmlFor="contact-subject" label="Topic" />
        <select
          id="contact-subject"
          name="subject"
          required
          defaultValue={v?.subject ?? ''}
          aria-invalid={err.subject ? true : undefined}
          aria-describedby={err.subject ? 'contact-subject-error' : undefined}
          className={`${inputClass} ${err.subject ? bad : ok}`}
        >
          <option value="" disabled>Choose a topic</option>
          {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <FieldFooter error={err.subject} errorId="contact-subject-error" />
      </div>

      <div>
        <FieldLabel htmlFor="contact-message" label="Message" />
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={2000}
          placeholder="How can we help?"
          defaultValue={v?.message}
          aria-invalid={err.message ? true : undefined}
          aria-describedby={err.message ? 'contact-message-error' : undefined}
          className={`${inputClass} resize-y ${err.message ? bad : ok}`}
        />
        <FieldFooter error={err.message} errorId="contact-message-error" />
      </div>

      {state.message && <FormAlert ok={state.ok} message={state.message} />}

      <SubmitButton pending={pending} pendingLabel="Sending…" className="w-full sm:w-auto">Send message</SubmitButton>
    </form>
  );
}
