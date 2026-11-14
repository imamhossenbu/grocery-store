import { revalidateTag } from 'next/cache';
import { requireRevalidateSecret } from '@/lib/bearer';

/**
 * POST /api/revalidate — called by the admin panel after it edits the catalog.
 *
 *   curl -X POST https://<site>/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tags":["reviews:mango-himsagar"]}'      # body optional
 *
 * Always refreshes the 'catalog' tag (products, categories, coupons). The
 * optional body may add `reviews:<productId>` tags and `settings` (delivery
 * charges). Catalog and review tags use stale-while-revalidate ('max'):
 * visitors get the cached page while fresh data loads in the background.
 * `settings` expires at once, so no shopper sees an old delivery fee that
 * place_order() would no longer charge.
 */

const EXTRA_TAG_RE = /^(reviews:[A-Za-z0-9_-]{1,80}|settings)$/;

export async function POST(request: Request) {
  const denied = requireRevalidateSecret(request);
  if (denied) return denied;

  const tags = new Set<string>(['catalog']);
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    try {
      const body = (await request.json()) as { tags?: unknown };
      if (Array.isArray(body?.tags)) {
        for (const t of body.tags.slice(0, 50)) if (typeof t === 'string' && EXTRA_TAG_RE.test(t)) tags.add(t);
      }
    } catch {
      return Response.json({ ok: false, error: 'Body must be valid JSON.' }, { status: 400 });
    }
  }

  for (const tag of tags) revalidateTag(tag, tag === 'settings' ? { expire: 0 } : 'max');
  return Response.json({ ok: true, revalidated: [...tags], at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
