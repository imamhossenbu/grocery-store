import type { ReactNode } from 'react';
import Link from 'next/link';
import { Clock, Mail, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';

export const SUPPORT_HOURS = '7:00 AM – 11:00 PM, every day';
export const telHref = `tel:${SUPPORT_PHONE.replace(/[\s-]/g, '')}`;

/** Hero band shared by all info pages. */
export function InfoHero({
  eyebrow,
  title,
  intro,
  crumb,
  meta,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  crumb: string;
  meta?: ReactNode;
}) {
  return (
    <section className="bg-hero-mesh border-b border-[#e3efe7]">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8">
        <Breadcrumbs items={[{ label: crumb }]} />
        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#c5e5d2] bg-[#e5f4eb] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#165b34]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1a663b]" />
          {eyebrow}
        </span>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight text-[#112a1d] sm:text-5xl">{title}</h1>
        <div className="mt-4 max-w-2xl text-base leading-relaxed text-[#445c50] sm:text-lg">{intro}</div>
        {meta && <div className="mt-4 text-xs text-[#7e9688]">{meta}</div>}
      </div>
    </section>
  );
}

export function InfoBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${className}`}>{children}</div>;
}

/** Long-form text with consistent typography (policies, terms). */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="max-w-3xl text-[15px] leading-7 text-[#344b3f]
        [&_h2]:mt-12 [&_h2]:scroll-mt-40 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#112a1d] [&_h2:first-child]:mt-0
        [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-[#112a1d]
        [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
        [&_li]:marker:text-[#1a663b] [&_a]:font-semibold [&_a]:text-[#1a663b] [&_a:hover]:underline [&_strong]:text-[#112a1d]"
    >
      {children}
    </div>
  );
}

/** Table of contents for long policy pages. */
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-widest text-[#5a7165]">On this page</p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="flex gap-2 text-[#234835] hover:text-[#1a663b]">
              <span className="w-5 shrink-0 text-[#93a99c]">{i + 1}.</span>
              {it.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** "Still need help?" card used at the bottom of help pages. */
export function SupportCard({ title = 'Still need help?' }: { title?: string }) {
  return (
    <aside className="relative overflow-hidden rounded-[2rem] bg-forest-gradient p-6 text-white shadow-card sm:p-8">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-[#b9d8c5]">
        Our Dhaka support team answers calls, emails and messages {SUPPORT_HOURS.toLowerCase()}. Have your order number (FB-XXXXXX) handy.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={telHref} className="inline-flex items-center gap-2 rounded-full bg-[#f5b82e] px-5 py-2.5 text-sm font-bold text-[#3a2502] hover:bg-[#e5a91f]">
          <Phone className="h-4 w-4" /> {SUPPORT_PHONE}
        </a>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
          <Mail className="h-4 w-4" /> Email us
        </a>
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
          Send a message
        </Link>
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-[#9fd8b5]">
        <Clock className="h-3.5 w-3.5" /> {SUPPORT_HOURS}
      </p>
    </aside>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
