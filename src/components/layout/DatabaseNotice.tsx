import { isDatabaseLive } from '@/lib/data/catalog';

/** Shown only until supabase/schema.sql has been run. */
export async function DatabaseNotice() {
  if (await isDatabaseLive()) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-900">
      Demo mode: showing the sample catalog. Run <code>supabase/schema.sql</code> and <code>npm run db:migrate</code> to go live. Orders are disabled until then.
    </div>
  );
}
