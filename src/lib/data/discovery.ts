import 'server-only';
import { getAllProducts, getCategories, queryProducts } from './catalog';

/**
 * Search helpers built on the cached catalog: "did you mean" spelling
 * suggestions for empty searches.
 */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const words = (s: string) => s.toLowerCase().match(/[a-z]{3,}/g) ?? [];

async function vocabulary(): Promise<Set<string>> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const vocab = new Set<string>();
  for (const p of products) {
    for (const w of [...words(p.name), ...words(p.origin ?? ''), ...(p.tags ?? []).flatMap(words)]) vocab.add(w);
  }
  for (const c of categories) for (const w of words(c.name)) vocab.add(w);
  return vocab;
}

/**
 * A corrected query that actually returns results, e.g. "mangoe hilsa" ->
 * "mango hilsha". Returns null when no better spelling is found.
 */
export async function suggestQuery(q: string): Promise<string | null> {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!terms.length) return null;
  const vocab = [...(await vocabulary())];

  let changed = false;
  const corrected = terms.map((t) => {
    if (vocab.some((v) => v.includes(t))) return t;
    const limit = t.length <= 4 ? 1 : 2;
    let best: { w: string; d: number } | null = null;
    for (const v of vocab) {
      if (Math.abs(v.length - t.length) > limit) continue;
      const d = levenshtein(t, v);
      if (d <= limit && (!best || d < best.d)) best = { w: v, d };
    }
    if (best) {
      changed = true;
      return best.w;
    }
    return null;
  });

  // Drop words we couldn't match at all, so "fresh xyzzy mango" still suggests "fresh mango".
  const kept = corrected.filter((w): w is string => Boolean(w));
  if (!kept.length || (!changed && kept.length === terms.length)) return null;
  const suggestion = kept.join(' ');
  const { total } = await queryProducts({ q: suggestion, perPage: 1 });
  return total > 0 ? suggestion : null;
}
