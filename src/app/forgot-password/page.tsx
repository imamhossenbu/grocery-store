import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/account/AuthShell';
import { ForgotPasswordForm } from '@/components/account/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your FreshBasket account password.',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you registered with and we’ll send you a link to choose a new one."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-bold text-[#1a663b] hover:underline">Back to sign in</Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
