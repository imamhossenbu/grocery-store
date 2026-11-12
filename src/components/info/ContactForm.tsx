'use client';

import { useActionState, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitContactMessage, type ContactFormState } from '@/actions/contact';
import { FormAlert, SubmitButton, TextField } from '@/components/account/FormControls';
import { Field, PhoneInput, Textarea } from '@/components/ui/Field';
import { CONTACT_SUBJECTS } from './contact-subjects';
import { Select } from '@/components/ui/Select';

const initial: ContactFormState = { ok: false, message: '' };


export interface ContactDefaults {
  name?: string;
  email?: string;
  phone?: string;
  orderId?: string;
  subject?: string;
  message?: string;
}

/** `defaults` pre-fills the form (e.g. for a signed-in customer). */
export function ContactForm({ defaults }: { defaults?: ContactDefaults } = {}) {
  const [state, action, pending] = useActionState(submitContactMessage, initial);
  const v = state.values ?? defaults;
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
        <Field label="Mobile number" optional error={err.phone}>
          {({ state, ...p }) => <PhoneInput name="phone" defaultValue={v?.phone} state={state} {...p} />}
        </Field>
        <TextField label="Order number" name="orderId" optional placeholder="FB-123456" maxLength={9} defaultValue={v?.orderId} hint="Helps us find your order faster." />
      </div>

      <Field label="Topic" required error={err.subject}>
        {({ state, ...p }) => (
          <Select
            name="subject"
            required
            defaultValue={v?.subject ?? ''}
            placeholder="Choose a topic"
            invalid={state === 'error'}
            id={p.id}
            aria-describedby={p['aria-describedby']}
            options={CONTACT_SUBJECTS.map((s) => ({ value: s, label: s }))}
          />
        )}
      </Field>

      <MessageField defaultValue={v?.message} error={err.message} />

      {state.message && <FormAlert ok={state.ok} message={state.message} />}

      <SubmitButton pending={pending} pendingLabel="Sending…" className="w-full sm:w-auto">Send message</SubmitButton>
    </form>
  );
}

function MessageField({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  const [len, setLen] = useState(defaultValue?.length ?? 0);
  return (
    <Field label="Message" required error={error} counter={`${len}/2000`}>
      {({ state, ...p }) => (
        <Textarea
          name="message"
          required
          minRows={5}
          minLength={10}
          maxLength={2000}
          placeholder="How can we help?"
          defaultValue={defaultValue}
          onChange={(e) => setLen(e.target.value.length)}
          state={state}
          {...p}
        />
      )}
    </Field>
  );
}
