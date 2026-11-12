import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { safeNext } from '@/components/account/safe-next';

/**
 * Runs before every page request:
 *  1. Refreshes the Supabase session cookies (the standard @supabase/ssr
 *     pattern) so Server Components always see a valid access token.
 *  2. Optimistic routing: signed-out visitors to /account/** go to /login,
 *     signed-in visitors to /login or /register go to their account.
 *
 * This is NOT the authorization layer — every Server Component and Server
 * Action that touches private data verifies the user again itself.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.assign(cacheHeaders, headers);
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Must run before any response is produced: it triggers the token refresh.
  // getClaims() verifies the JWT (locally with asymmetric keys, otherwise via
  // the Auth server) — never trust getSession() here.
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;
  } catch {
    userId = null;
  }

  const { pathname, search } = request.nextUrl;

  // Redirects must carry any refreshed cookies, otherwise the session is lost.
  const redirectTo = (target: URL) => {
    const res = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    Object.entries(cacheHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  };

  const isAccount = pathname === '/account' || pathname.startsWith('/account/');
  if (!userId && isAccount && request.method === 'GET') {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '';
    login.searchParams.set('next', `${pathname}${search}`);
    return redirectTo(login);
  }

  const isAuthForm = pathname === '/login' || pathname === '/register';
  if (userId && isAuthForm && request.method === 'GET') {
    const dest = new URL(safeNext(request.nextUrl.searchParams.get('next')), request.url);
    return redirectTo(dest);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, the favicon, static image/font files
    // and the payment endpoints (/api/payment/**: cross-site POSTs from the
    // SSLCommerz gateway and the cron job — no session to refresh, never redirect).
    '/((?!_next/static|_next/image|api/payment/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|txt|xml|webmanifest)$).*)',
  ],
};
