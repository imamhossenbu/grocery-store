import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Server-only client with the secret key. Bypasses RLS — never import this
 * from a Client Component (the `server-only` import makes that a build error).
 */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local');
    }
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** PostgREST error codes that mean "schema.sql has not been run yet". */
export function isMissingTableError(error: { code?: string } | null | undefined): boolean {
  return error?.code === 'PGRST205' || error?.code === '42P01' || error?.code === 'PGRST202';
}
