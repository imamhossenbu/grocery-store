import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listingHref, type ListingFilters } from './params';

function pages(current: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(count - 1, current + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < count - 1) out.push('…');
  out.push(count);
  return out;
}

export function Pagination({ basePath, filters, page, pageCount }: { basePath: string; filters: ListingFilters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => listingHref(basePath, filters, { page: p });
  const arrow =
    'inline-flex h-10 items-center gap-1 rounded-full border border-[#cfe3d6] bg-white px-3 text-sm font-semibold text-[#112a1d] transition hover:border-[#1a663b]';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={arrow}>
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className={`${arrow} opacity-40`} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
        </span>
      )}
      <ol className="flex items-center gap-1">
        {pages(page, pageCount).map((p, i) =>
          p === '…' ? (
            <li key={`gap${i}`} className="px-1 text-[#7e9688]" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`grid h-10 min-w-10 place-items-center rounded-full px-2 text-sm font-bold transition ${
                  p === page ? 'bg-[#1a663b] text-white shadow-glow' : 'text-[#234835] hover:bg-[#e8f5ee]'
                }`}
              >
                {p}
              </Link>
            </li>
          )
        )}
      </ol>
      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={arrow}>
          <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${arrow} opacity-40`} aria-disabled="true">
          <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
