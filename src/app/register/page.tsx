import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/account/AuthShell';
import { AuthFormSkeleton } from '@/components/store-ui/Skeletons';
import { RegisterForm } from '@/components/account/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a free FreshBasket account to save your Dhaka delivery address, reorder favourites and track every order.',
  alternates: { canonical: '/register' },
};

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute — and checkout gets much quicker.">
      <Suspense fallback={<AuthFormSkeleton fields={4} extra />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
