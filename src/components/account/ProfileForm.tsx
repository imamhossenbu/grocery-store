'use client';

import { useActionState } from 'react';
import { updateProfile, type ProfileFormState } from '@/actions/account';
import { AddressPicker } from '@/components/address/AddressPicker';
import type { Profile } from '@/types/store';
import { FormAlert, SubmitButton, TextField } from './FormControls';
import { Field, PhoneInput } from '@/components/ui/Field';

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
          <Field label="Mobile number" error={err.phone} hint="Our rider calls this number when they arrive.">
            {({ state, ...p }) => <PhoneInput name="phone" defaultValue={v.phone} state={state} {...p} />}
          </Field>
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
        <p className="text-sm text-[#3f5649]">We fill this in at checkout — you can still change it for any single order. We deliver across Bangladesh.</p>
        <AddressPicker
          idPrefix="profile-addr"
          defaultValue={{
            division: v.division,
            district: v.district ?? '',
            upazila: v.upazila ?? v.area ?? '',
            union: v.union ?? '',
            city: v.area ? v.city : undefined,
            address: v.address,
            landmark: v.landmark ?? '',
            postcode: v.postcode ?? '',
          }}
          errors={{
            division: err.division,
            district: err.district,
            upazila: err.upazila ?? err.area,
            union: err.union,
            address: err.address,
            landmark: err.landmark,
            postcode: err.postcode,
          }}
        />
      </fieldset>

      {state.message && <FormAlert ok={state.ok} message={state.message} />}

      <div className="flex justify-end border-t border-[#eef5f0] pt-5">
        <SubmitButton pending={pending} pendingLabel="Saving…" className="w-full sm:w-auto">Save changes</SubmitButton>
      </div>
    </form>
  );
}
