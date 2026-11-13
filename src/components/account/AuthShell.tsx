import type { ReactNode } from 'react';
import Link from 'next/link';
import { Banknote, Leaf, ShieldCheck, Truck } from 'lucide-react';

/** Two-column card used by login / register / password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:px-8">
        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-forest-gradient p-10 text-white shadow-card lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-gradient shadow-glow">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-bold">
              Fresh<span className="text-[#3ed481]">Basket</span>
            </span>
          </Link>
          <h2 className="mt-12 font-display text-4xl font-bold leading-tight">
            Your weekly bazaar,
            <br />
            <span className="text-[#f5b82e]">without the bazaar.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#b9d8c5]">
            Save your address once, reorder in seconds and follow every delivery from our hub to your door.
          </p>
          <ul className="mt-10 space-y-4 text-sm">
            {[
              { icon: Truck, text: 'Same-day delivery across Dhaka in three daily slots' },
              { icon: Banknote, text: 'Pay cash when your groceries arrive' },
              { icon: ShieldCheck, text: 'Freshness guarantee — replaced at your door' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f5b82e]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[#dcefe3]">{text}</span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#2ca05d]/25 blur-3xl" />
        </aside>

        <section className="rounded-[2rem] border border-[#dfece3] bg-white p-6 shadow-card sm:p-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-[#5a7165] sm:text-base">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-[#eef5f0] pt-6 text-center text-sm text-[#5a7165]">{footer}</div>}
        </section>
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="animate-pulse space-y-5" aria-hidden="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded-full bg-[#e8f2ec]" />
          <div className="h-12 w-full rounded-2xl bg-[#eef5f0]" />
        </div>
      ))}
      <div className="h-12 w-full rounded-full bg-[#dcebe2]" />
    </div>
  );
}
