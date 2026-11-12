import type { Metadata } from 'next';
import Link from 'next/link';
import { Banknote, Clock, MapPin, PackageCheck, PhoneCall, Truck } from 'lucide-react';
import { InfoBody, InfoHero, SupportCard } from '@/components/info/InfoLayout';
import { DELIVERY_SLOTS, DHAKA_AREAS } from '@/lib/constants';
import { formatBDT } from '@/lib/format';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Delivery information',
  description: `Same-day grocery delivery across Dhaka in three slots: 8–11 AM, 1–4 PM and 5–8 PM. Free delivery over ${formatBDT(FREE_DELIVERY_THRESHOLD)}, otherwise ${formatBDT(DELIVERY_FEE)}. Cash on delivery.`,
  alternates: { canonical: '/delivery' },
};

const STEPS = [
  { icon: PackageCheck, title: 'You order', text: 'Choose your groceries and a delivery slot. We confirm your order by SMS or a quick call.' },
  { icon: Clock, title: 'We pick & pack', text: 'Your order is picked fresh at our Dhaka hub, checked for quality and packed with chilled items kept cold.' },
  { icon: Truck, title: 'Out for delivery', text: 'A FreshBasket rider brings it in your slot and calls when they reach your address.' },
  { icon: Banknote, title: 'Check, then pay', text: 'Look over your items, hand back anything not up to standard, and pay the rider in cash.' },
];

export default function DeliveryPage() {
  return (
    <>
      <InfoHero
        crumb="Delivery information"
        eyebrow="Delivery"
        title="Same-day delivery across Dhaka"
        intro={<>Pick a slot that suits you and we’ll bring your groceries the same day. Delivery is <strong>free over {formatBDT(FREE_DELIVERY_THRESHOLD)}</strong>, and a flat {formatBDT(DELIVERY_FEE)} below that.</>}
      />
      <InfoBody className="space-y-14">
        <section aria-labelledby="slots">
          <h2 id="slots" className="font-display text-3xl font-bold text-[#112a1d]">Delivery slots</h2>
          <p className="mt-2 text-[#5a7165]">Every day of the week, including Fridays. Choose your slot at checkout.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {DELIVERY_SLOTS.map((s) => (
              <li key={s.id} className="rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
                <Clock className="h-6 w-6 text-[#1a663b]" />
                <p className="mt-3 text-lg font-bold text-[#112a1d]">{s.label}</p>
                <p className="font-display text-2xl font-bold text-[#1a663b]">{s.time}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[#5a7165]">
            If a slot has already started or is fully booked, your order moves to the next available slot and we tell you when we confirm. During heavy rain, hartals or Eid rush, deliveries can run late — we’ll always call ahead.
          </p>
        </section>

        <section aria-labelledby="charges" className="grid gap-4 sm:grid-cols-2">
          <h2 id="charges" className="sr-only">Delivery charges</h2>
          <div className="rounded-3xl bg-forest-gradient p-6 text-white shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9fd8b5]">Orders of {formatBDT(FREE_DELIVERY_THRESHOLD)} or more</p>
            <p className="mt-2 font-display text-4xl font-bold text-[#f5b82e]">Free delivery</p>
            <p className="mt-2 text-sm text-[#b9d8c5]">Calculated on your item total after any coupon discount is applied.</p>
          </div>
          <div className="rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-widest text-[#5a7165]">Orders under {formatBDT(FREE_DELIVERY_THRESHOLD)}</p>
            <p className="mt-2 font-display text-4xl font-bold text-[#112a1d]">{formatBDT(DELIVERY_FEE)}</p>
            <p className="mt-2 text-sm text-[#5a7165]">One flat charge anywhere in Dhaka. No surge pricing, no small-order fee.</p>
          </div>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="font-display text-3xl font-bold text-[#112a1d]">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
                <span className="absolute right-5 top-5 font-display text-3xl font-bold text-[#e3efe7]">{i + 1}</span>
                <Icon className="h-6 w-6 text-[#1a663b]" />
                <h3 className="mt-3 font-bold text-[#112a1d]">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#5a7165]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="areas" className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 id="areas" className="font-display text-3xl font-bold text-[#112a1d]">Where we deliver</h2>
            <p className="mt-2 text-[#5a7165]">We currently deliver inside Dhaka city. Not sure if we reach you? Choose “Other Area in Dhaka” at checkout and we’ll confirm by phone before packing.</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {DHAKA_AREAS.map((a) => (
                <li key={a} className="inline-flex items-center gap-1.5 rounded-full border border-[#dfece3] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#234835]">
                  <MapPin className="h-3.5 w-3.5 text-[#1a663b]" /> {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
            <h3 className="flex items-center gap-2 font-bold text-[#112a1d]"><PhoneCall className="h-5 w-5 text-[#1a663b]" /> Good to know</h3>
            <ul className="space-y-3 text-sm leading-relaxed text-[#445c50]">
              <li>• Keep your phone nearby — the rider calls on arrival and waits up to 10 minutes.</li>
              <li>• Add landmarks, gate codes or floor numbers in the order notes.</li>
              <li>• If we can’t reach you, we bring the order back and rearrange a slot free of charge the first time.</li>
              <li>• Chilled and frozen items travel in insulated bags; please refrigerate them promptly.</li>
              <li>• You can follow your order any time on the <Link href="/track-order" className="font-semibold text-[#1a663b] hover:underline">track order</Link> page.</li>
            </ul>
          </div>
        </section>

        <SupportCard title="Questions about a delivery?" />
      </InfoBody>
    </>
  );
}
