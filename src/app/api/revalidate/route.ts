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
 * optional body may add `reviews:<productId>` tags. Uses stale-while-revalidate
 * ('max'): visitors get the cached page while fresh data loads in the background.
 */

const EXTRA_TAG_RE = /^reviews:[A-Za-z0-9_-]{1,80}$/;

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

  for (const tag of tags) revalidateTag(tag, 'max');
  return Response.json({ ok: true, revalidated: [...tags], at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
