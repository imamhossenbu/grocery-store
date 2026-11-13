import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/account/AuthShell';
import { AuthFormSkeleton } from '@/components/store-ui/Skeletons';
import { LoginForm } from '@/components/account/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to FreshBasket to check out faster, see your order history and manage your delivery address.',
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to check out faster and follow your orders.">
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
