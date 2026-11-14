import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

/**
 * Per-request client bound to the visitor's auth cookies (publishable key,
 * RLS applies). Use it to find out who is signed in; use supabaseAdmin()
 * for privileged reads/writes after checking the user.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // proxy.ts refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  // Request-time only: getUser() reads Date.now() (token expiry), which Cache
  // Components rejects while prerendering. connection() stops the prerender
  // here, before the auth client runs.
  await connection();
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
