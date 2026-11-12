import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[#5a7165]">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link href="/" className="hover:text-[#1a663b]">Home</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-[#9ab5a5]" />
            {it.href ? (
              <Link href={it.href} className="hover:text-[#1a663b]">{it.label}</Link>
            ) : (
              <span aria-current="page" className="font-semibold text-[#112a1d] line-clamp-1">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
