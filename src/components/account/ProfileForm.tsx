'use client';

import { useActionState } from 'react';
import { updateProfile, type ProfileFormState } from '@/actions/account';
import { DHAKA_AREAS } from '@/lib/constants';
import type { Profile } from '@/types/store';
import { FieldFooter, FieldLabel, FormAlert, inputClass, SubmitButton, TextField } from './FormControls';

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, { ok: false, message: '' });
  const v = state.values ?? profile;
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      <fieldset className="space-y-5">
        <legend className="mb-4 font-display text-xl font-bold text-[#112a1d]">Personal details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Full name" name="fullName" autoComplete="name" required maxLength={80} defaultValue={v.fullName} error={err.fullName} />
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="01XXXXXXXXX"
            maxLength={20}
            defaultValue={v.phone}
            error={err.phone}
            hint="Our rider calls this number when they arrive."
          />
          <TextField
            label="Email"
            name="emailDisplay"
            type="email"
            value={email}
            readOnly
            disabled
            className="sm:col-span-2"
            hint="Your sign-in email. Contact support to change it."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-[#eef5f0] pt-6">
        <legend className="mb-1 font-display text-xl font-bold text-[#112a1d]">Default delivery address</legend>
        <p className="text-sm text-[#5a7165]">We fill this in at checkout — you can still change it for any single order.</p>
        <div>
          <FieldLabel htmlFor="profile-address" label="House, road, block" />
          <textarea
            id="profile-address"
            name="address"
            rows={3}
            maxLength={200}
            autoComplete="street-address"
            placeholder="e.g. House 12, Road 5, Block C, near Banani Lake Park"
            defaultValue={v.address}
            aria-invalid={err.address ? true : undefined}
            aria-describedby={err.address ? 'profile-address-error' : undefined}
            className={`${inputClass} resize-y ${err.address ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-[#d3e5da] focus:border-[#1a663b] focus:ring-[#1a663b]/10'}`}
          />
          <FieldFooter error={err.address} errorId="profile-address-error" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="profile-area" label="Area" />
            <select
              id="profile-area"
              name="area"
              defaultValue={v.area}
              aria-invalid={err.area ? true : undefined}
              aria-describedby={err.area ? 'profile-area-error' : undefined}
              className={`${inputClass} ${err.area ? 'border-red-300' : 'border-[#d3e5da] focus:border-[#1a663b] focus:ring-[#1a663b]/10'}`}
            >
              <option value="">Select your area</option>
              {DHAKA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <FieldFooter error={err.area} errorId="profile-area-error" />
          </div>
          <TextField label="City" name="city" autoComplete="address-level2" maxLength={60} defaultValue={v.city || 'Dhaka'} error={err.city} hint="We currently deliver inside Dhaka." />
        </div>
      </fieldset>

      {state.message && <FormAlert ok={state.ok} message={state.message} />}

      <div className="flex justify-end border-t border-[#eef5f0] pt-5">
        <SubmitButton pending={pending} pendingLabel="Saving…" className="w-full sm:w-auto">Save changes</SubmitButton>
      </div>
    </form>
  );
}
