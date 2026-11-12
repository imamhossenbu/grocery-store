'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin, isMissingTableError } from '@/lib/supabase/admin';
import { safeNext } from '@/components/account/safe-next';

export interface AuthFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Non-secret values echoed back so the form keeps them after an error. */
  values?: Record<string, string>;
  /** Registration succeeded but the address must be confirmed first. */
  needsConfirmation?: boolean;
  /** Email that may need a fresh confirmation link (login screen). */
  unconfirmedEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === 'string' ? v : '';
}

/** Server-side password policy (the client shows the same hints). */
function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 72) return 'Use 72 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

/**
 * Origin used in links inside auth emails. Prefer the configured site URL;
 * fall back to the request's host. Supabase only honours redirect URLs that
 * are on the project's allow-list, so a spoofed Host header cannot be used to
 * send links elsewhere.
 */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function friendlyAuthError(error: AuthError, fallback: string): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Please try again.';
    case 'email_not_confirmed':
      return 'Please verify your email address first — enter the code we emailed you.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'weak_password':
      return 'That password is too easy to guess. Please choose a stronger one.';
    case 'same_password':
      return 'Your new password must be different from the current one.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'New sign-ups are paused right now. Please try again later.';
    case 'user_banned':
      return 'This account has been suspended. Please contact support.';
    case 'session_not_found':
    case 'session_expired':
      return 'Your session has expired. Please sign in again.';
    default:
      return error.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : fallback;
  }
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, 'email').trim().toLowerCase();
  const password = field(formData, 'password');
  const next = safeNext(field(formData, 'next'));
  const values = { email };

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email) || email.length > 200) fieldErrors.email = 'Enter a valid email address.';
  if (!password || password.length > 200) fieldErrors.password = 'Enter your password.';
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors, values };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'email_not_confirmed') {
      // Send a fresh code so the shopper can verify right here.
      await supabase.auth.resend({ type: 'signup', email });
      return {
        ok: false,
        message: `Your email isn’t verified yet. We’ve sent a 6-digit code to ${email}.`,
        values: { email, next },
        unconfirmedEmail: email,
      };
    }
    return { ok: false, message: friendlyAuthError(error, 'We couldn’t sign you in. Please try again.'), values };
  }

  redirect(next);
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fullName = field(formData, 'fullName').trim().replace(/\s+/g, ' ');
  const email = field(formData, 'email').trim().toLowerCase();
  const password = field(formData, 'password');
  const confirm = field(formData, 'confirmPassword');
  const next = safeNext(field(formData, 'next'));
  const values = { fullName, email };

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2 || fullName.length > 80) fieldErrors.fullName = 'Enter your full name (2–80 characters).';
  if (!EMAIL_RE.test(email) || email.length > 200) fieldErrors.email = 'Enter a valid email address.';
  const pwProblem = passwordProblem(password);
  if (pwProblem) fieldErrors.password = pwProblem;
  if (!confirm) fieldErrors.confirmPassword = 'Please confirm your password.';
  else if (confirm !== password) fieldErrors.confirmPassword = 'Passwords don’t match.';
  if (formData.get('terms') !== 'on') fieldErrors.terms = 'Please accept the terms to continue.';
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors, values };

  const origin = await siteOrigin();
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return {
        ok: false,
        message: 'An account with this email already exists. Sign in instead, or reset your password.',
        fieldErrors: { email: 'This email is already registered.' },
        values,
      };
    }
    if (error.code === 'weak_password') {
      return { ok: false, message: friendlyAuthError(error, ''), fieldErrors: { password: 'Choose a stronger password.' }, values };
    }
    return { ok: false, message: friendlyAuthError(error, 'We couldn’t create your account. Please try again.'), values };
  }

  // With email confirmation on, Supabase hides whether the address was
  // already registered: it returns a user with no identities. Only create a
  // profile row for genuinely new users, and never overwrite an existing one.
  const user = data.user;
  const isNewUser = !!user && (user.identities?.length ?? 0) > 0;
  if (user && isNewUser) {
    try {
      const { error: profileError } = await supabaseAdmin()
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName }, { onConflict: 'id', ignoreDuplicates: true });
      if (profileError && !isMissingTableError(profileError)) {
        console.error('profiles upsert failed after sign-up:', profileError.code);
      }
    } catch {
      // Profile can be completed later from /account/profile.
    }
  }

  if (!data.session) {
    return {
      ok: true,
      needsConfirmation: true,
      message: `We’ve sent a 6-digit code to ${email}.`,
      values: { email, next },
    };
  }

  redirect(next);
}

// ---------------------------------------------------------------------------
// Email verification with a one-time code
// ---------------------------------------------------------------------------

/** Checks the 6-digit code from the confirmation email and signs the user in. */
export async function verifyEmailOtp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, 'email').trim().toLowerCase();
  const code = field(formData, 'code').replace(/\D/g, '');
  const next = safeNext(field(formData, 'next'));

  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: 'Your session lost the email address. Please sign up or sign in again.' };
  if (code.length !== 6) return { ok: false, message: 'Enter the 6-digit code from the email.', fieldErrors: { code: 'Enter all 6 digits.' } };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) {
    const expired = error.code === 'otp_expired';
    return {
      ok: false,
      message: expired
        ? 'That code is wrong or has expired. Check the latest email, or send a new code.'
        : friendlyAuthError(error, 'We couldn’t verify that code. Please try again.'),
      fieldErrors: { code: expired ? 'Wrong or expired code.' : 'Try again.' },
    };
  }

  redirect(next);
}

/** Sends a fresh verification code. Same answer whether or not the address exists. */
export async function resendConfirmation(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, 'email').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, message: 'Enter a valid email address.' };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error && (error.status === 429 || error.code?.startsWith('over_'))) {
    return { ok: false, message: 'Please wait a minute before requesting another code.' };
  }
  return { ok: true, message: `A new code is on its way to ${email}.` };
}

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, 'email').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { ok: false, message: 'Enter a valid email address.', fieldErrors: { email: 'Enter a valid email address.' }, values: { email } };
  }

  const origin = await siteOrigin();
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error && (error.status === 429 || error.code?.startsWith('over_'))) {
    return { ok: false, message: 'Too many reset requests. Please wait a few minutes and try again.', values: { email } };
  }
  // Never reveal whether an account exists for this address.
  return {
    ok: true,
    message: `If an account exists for ${email}, you’ll get an email with a link to reset your password in a minute or two. Check your spam folder too.`,
  };
}

/** Sets a new password for the session created by the recovery link. */
export async function resetPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = field(formData, 'password');
  const confirm = field(formData, 'confirmPassword');

  const fieldErrors: Record<string, string> = {};
  const pwProblem = passwordProblem(password);
  if (pwProblem) fieldErrors.password = pwProblem;
  if (confirm !== password) fieldErrors.confirmPassword = 'Passwords don’t match.';
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { ok: false, message: 'Your reset link has expired. Please request a new one.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: friendlyAuthError(error, 'We couldn’t update your password. Please try again.') };

  return { ok: true, message: 'Your password has been updated. You’re signed in.' };
}

// ---------------------------------------------------------------------------
// Change password (signed in)
// ---------------------------------------------------------------------------

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const current = field(formData, 'currentPassword');
  const password = field(formData, 'password');
  const confirm = field(formData, 'confirmPassword');

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return { ok: false, message: 'Your session has expired. Please sign in again.' };

  const fieldErrors: Record<string, string> = {};
  if (!current) fieldErrors.currentPassword = 'Enter your current password.';
  const pwProblem = passwordProblem(password);
  if (pwProblem) fieldErrors.password = pwProblem;
  else if (password === current) fieldErrors.password = 'Choose a password different from your current one.';
  if (confirm !== password) fieldErrors.confirmPassword = 'Passwords don’t match.';
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };

  // Re-check the current password before allowing the change.
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (verifyError) {
    return {
      ok: false,
      message: verifyError.code === 'invalid_credentials' ? 'Your current password is incorrect.' : friendlyAuthError(verifyError, 'Could not verify your current password.'),
      fieldErrors: verifyError.code === 'invalid_credentials' ? { currentPassword: 'Incorrect password.' } : undefined,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'reauthentication_needed' || error.code === 'reauth_nonce_missing') {
      return { ok: false, message: 'For security, please use “Forgot password” to set a new password by email.' };
    }
    return { ok: false, message: friendlyAuthError(error, 'We couldn’t update your password. Please try again.') };
  }

  return { ok: true, message: 'Password updated. Use your new password next time you sign in.' };
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  // Sign out this device only; other devices keep their sessions.
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/');
}
