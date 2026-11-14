import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Clock, Mail, MapPin, MessageSquareText, PackageSearch, Phone } from 'lucide-react';
import { ContactForm } from '@/components/info/ContactForm';
import { InfoBody, InfoHero, SUPPORT_HOURS, telHref } from '@/components/info/InfoLayout';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Call ${SUPPORT_PHONE}, email ${SUPPORT_EMAIL} or send us a message. FreshBasket support is open ${SUPPORT_HOURS.toLowerCase()} in Dhaka.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <InfoHero
        crumb="Contact"
        eyebrow="We’re here to help"
        title="Contact FreshBasket"
        intro="Questions about an order, a delivery or a product? Talk to a real person on our Dhaka team — we usually reply within a few hours."
      />
      <InfoBody>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <ContactCard icon={Phone} title="Call us" detail={<a href={telHref} className="hover:text-[#1a663b]">{SUPPORT_PHONE}</a>} note="Fastest for orders that are already on the way." />
            <ContactCard icon={Mail} title="Email" detail={<a href={`mailto:${SUPPORT_EMAIL}`} className="break-all hover:text-[#1a663b]">{SUPPORT_EMAIL}</a>} note="Best for refunds, invoices and bulk orders." />
            <ContactCard icon={Clock} title="Support hours" detail={SUPPORT_HOURS} note="Including Fridays and public holidays, except Eid days." />
            <ContactCard
              icon={MapPin}
              title="Delivery hub"
              detail={<address className="not-italic">FreshBasket Dhaka Delivery Hub<br />Dhaka, Bangladesh</address>}
              note="Our hub is a packing facility, not a shop — orders are online only."
            />
            <Link href="/track-order" className="flex items-center gap-3 rounded-3xl border border-[#bce3cb] bg-[#effaf3] p-4 text-sm font-semibold text-[#14522f] hover:border-[#1a663b]">
              <PackageSearch className="h-5 w-5" />
              Looking for your order? Track it with your order number.
            </Link>
          </div>

          <section aria-labelledby="contact-form-title" className="relative rounded-[2rem] border border-[#dfece3] bg-white p-5 shadow-card sm:p-8">
            <h2 id="contact-form-title" className="flex items-center gap-2 font-display text-2xl font-bold text-[#112a1d]">
              <MessageSquareText className="h-6 w-6 text-[#1a663b]" /> Send us a message
            </h2>
            <p className="mt-1 mb-6 text-sm text-[#5a7165]">Fill in the form and we’ll reply by email, or call you if you leave a number.</p>
            <ContactForm />
            <p className="mt-6 text-[13px] text-[#5a7165]">
              We use your details only to answer this message. See our <Link href="/privacy" className="font-semibold text-[#1a663b] hover:underline">privacy policy</Link>.
            </p>
          </section>
        </div>
      </InfoBody>
    </>
  );
}

function ContactCard({ icon: Icon, title, detail, note }: { icon: typeof Phone; title: string; detail: ReactNode; note: string }) {
  return (
    <div className="flex gap-4 rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#5a7165]">{title}</h3>
        <div className="mt-1 font-bold text-[#112a1d]">{detail}</div>
        <p className="mt-1 text-[13px] text-[#5a7165]">{note}</p>
      </div>
    </div>
  );
}
