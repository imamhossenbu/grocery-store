import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { safeNext } from '@/components/account/safe-next';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

/**
 * Landing point for links in Supabase auth emails (confirm sign-up, reset
 * password, change email). Supports both flows:
 *  - PKCE:        /auth/callback?code=…&next=/account
 *  - Token hash:  /auth/callback?token_hash=…&type=recovery&next=/reset-password
 * On success the session cookies are set and the visitor continues to a
 * same-origin `next` path; on failure they land on /login with a message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');
  const type = OTP_TYPES.find((t) => t === typeParam);

  const fallback = type === 'recovery' ? '/reset-password' : '/account';
  const next = safeNext(searchParams.get('next'), fallback);

  const fail = (reason: string) => {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', reason);
    return NextResponse.redirect(url);
  };

  // Supabase forwards provider errors (e.g. expired links) as query params.
  if (searchParams.get('error') || searchParams.get('error_code')) {
    return fail(searchParams.get('error_code') === 'otp_expired' ? 'link_expired' : 'link_invalid');
  }

  const supabase = await supabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(error.code === 'flow_state_expired' || error.code === 'otp_expired' ? 'link_expired' : 'link_invalid');
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail(error.code === 'otp_expired' ? 'link_expired' : 'link_invalid');
  } else {
    return fail('link_invalid');
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
