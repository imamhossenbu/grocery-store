import { cachedGeoIndex } from '@/lib/address/geo';

/**
 * Divisions + districts for the address picker (~6 KB).
 * Static: prerendered at build time and cached by the browser for a day.
 */
export async function GET() {
  return Response.json(await cachedGeoIndex(), {
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
