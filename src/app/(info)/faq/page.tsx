import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { FAQ_GROUPS } from '@/components/info/faq-data';
import { InfoBody, InfoHero, JsonLd, SupportCard } from '@/components/info/InfoLayout';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Answers about ordering, same-day delivery slots in Dhaka, cash on delivery, our freshness guarantee, returns and your FreshBasket account.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_GROUPS.flatMap((g) =>
      g.items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } }))
    ),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <InfoHero
        crumb="FAQ"
        eyebrow="Help centre"
        title="Frequently asked questions"
        intro="Everything about ordering, delivery slots, paying cash at your door and our freshness promise. Can’t find your answer? Our team is a call away."
      />
      <InfoBody>
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-40 lg:self-start">
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 [scrollbar-width:none]">
              {FAQ_GROUPS.map((g) => (
                <li key={g.id} className="shrink-0">
                  <a href={`#${g.id}`} className="block rounded-full border border-[#dfece3] bg-white px-4 py-2 text-sm font-semibold text-[#234835] hover:border-[#1a663b] hover:text-[#1a663b] lg:rounded-2xl lg:border-0 lg:bg-transparent lg:hover:bg-[#f0f7f2]">
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-12">
            {FAQ_GROUPS.map((g) => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-40">
                <h2 id={`${g.id}-title`} className="font-display text-2xl font-bold text-[#112a1d]">{g.title}</h2>
                <div className="mt-4 space-y-3">
                  {g.items.map((it) => (
                    <details key={it.q} className="group rounded-2xl border border-[#dfece3] bg-white shadow-soft open:border-[#1a663b]/30">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-[15px] font-bold text-[#112a1d] hover:text-[#1a663b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a663b] [&::-webkit-details-marker]:hidden">
                        {it.q}
                        <ChevronDown className="h-5 w-5 shrink-0 text-[#5a7165] transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <p className="px-5 pb-5 text-sm leading-relaxed text-[#445c50]">{it.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
            <SupportCard />
          </div>
        </div>
      </InfoBody>
    </>
  );
}
