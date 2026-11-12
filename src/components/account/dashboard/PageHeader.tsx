import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/motion';

/** Breadcrumb + title band at the top of every dashboard page (static). */
export function AccountPageHeader({
  title,
  description,
  crumb,
  actions,
}: {
  title: string;
  description?: ReactNode;
  /** Last breadcrumb label; omit on the overview. */
  crumb?: string;
  actions?: ReactNode;
}) {
  return (
    <Reveal as="header" index={0} className="mb-6 flex flex-wrap items-end justify-between gap-4 ">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="hidden text-[13px] text-[#3f5649] sm:block">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-[#1a663b]">Home</Link></li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-[#9ab5a5]" aria-hidden />
              {crumb ? <Link href="/account" className="hover:text-[#1a663b]">My account</Link> : <span aria-current="page" className="font-semibold text-[#112a1d]">My account</span>}
            </li>
            {crumb && (
              <li className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-[#9ab5a5]" aria-hidden />
                <span aria-current="page" className="font-semibold text-[#112a1d]">{crumb}</span>
              </li>
            )}
          </ol>
        </nav>
        <h1 className="mt-1 font-display text-[1.75rem] font-bold leading-tight tracking-tight text-[#112a1d] sm:mt-2 sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-[#3f5649]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </Reveal>
  );
}

/** White dashboard card with an optional heading row. */
export function Panel({
  title,
  icon,
  action,
  children,
  className = '',
  bodyClassName = '',
  id,
  index = 0,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  /** Stagger position for the entrance animation. */
  index?: number;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <Reveal as="section" index={index} aria-labelledby={title ? headingId : undefined} id={id} className={`rounded-3xl border border-[#dfece3] bg-white shadow-soft ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <h2 id={headingId} className="flex items-center gap-2.5 font-display text-lg font-bold text-[#112a1d] sm:text-xl">
            {icon && <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f5ee] text-[#1a663b] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className={`p-5 sm:p-6 ${title ? 'pt-4 sm:pt-4' : ''} ${bodyClassName}`}>{children}</div>
    </Reveal>
  );
}
