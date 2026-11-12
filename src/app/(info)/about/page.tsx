import type { Metadata } from 'next';
import Link from 'next/link';
import { Banknote, HeartHandshake, Leaf, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { InfoBody, InfoHero, SupportCard } from '@/components/info/InfoLayout';
import { formatBDT } from '@/lib/format';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'About us',
  description: 'FreshBasket is a Dhaka online grocery bringing produce from Bangladeshi farms to your door the same day, with cash on delivery and a freshness guarantee.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { icon: Sprout, title: 'Sourced close to home', text: 'Vegetables from growers in Narsingdi, Jessore and Bogura, fish from trusted aratdars, and dairy from small farms — bought fresh every morning, not from cold storage.' },
  { icon: ShieldCheck, title: 'Checked twice', text: 'Every crate is inspected when it reaches our Dhaka hub and again when your order is packed. Anything that would not go into our own kitchen does not go into your bag.' },
  { icon: Truck, title: 'Same-day, on your schedule', text: 'Pick a morning, afternoon or evening slot and your groceries arrive the same day — no waiting until tomorrow for today’s dinner.' },
  { icon: Banknote, title: 'Pay when it arrives', text: 'Cash on delivery for every order. You see your groceries before you pay, and the price at checkout is the price at your door.' },
];

export default function AboutPage() {
  return (
    <>
      <InfoHero
        crumb="About us"
        eyebrow="Our story"
        title="Fresh from Bangladeshi farms to your Dhaka kitchen"
        intro="FreshBasket started with a simple frustration: the weekly trip to the kacha bazar takes hours, and the quality is a gamble. We set out to make honest, fresh groceries a few taps away — delivered the same day, paid in cash at the door."
      />
      <InfoBody className="space-y-16">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4 text-[15px] leading-7 text-[#344b3f]">
            <h2 className="font-display text-3xl font-bold text-[#112a1d]">Why we do it</h2>
            <p>
              Dhaka families spend a surprising share of their week buying food — fighting traffic to the bazar, haggling, and hoping the fish is as fresh as promised. Meanwhile farmers outside the city sell through several middlemen and keep only a fraction of what we pay.
            </p>
            <p>
              We buy directly where we can, pay farmers fairly and on time, and run a single hub in Dhaka where everything is checked, cleaned where needed, and packed to order. Shorter supply chains mean fresher food for you and a better price for the people who grow it.
            </p>
            <p>
              Today we deliver across Dhaka — from Uttara to Old Dhaka — in three daily slots, with free delivery on orders over {formatBDT(FREE_DELIVERY_THRESHOLD)}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '3', label: 'delivery slots every day' },
              { value: 'Same day', label: 'delivery across Dhaka' },
              { value: '100%', label: 'cash on delivery' },
              { value: '7 AM–11 PM', label: 'customer support' },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft">
                <p className="font-display text-2xl font-bold text-[#1a663b] sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-sm text-[#5a7165]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="values">
          <h2 id="values" className="font-display text-3xl font-bold text-[#112a1d]">What we promise</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-gradient text-white shadow-glow">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-[#112a1d]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a7165]">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-[#dfece3] bg-white p-6 shadow-soft sm:p-10 lg:grid-cols-[auto_1fr] lg:items-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#fef3c7] text-[#78350f]">
            <HeartHandshake className="h-8 w-8" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#112a1d]">The freshness guarantee</h2>
            <p className="mt-2 text-[15px] leading-7 text-[#445c50]">
              Check your order when it arrives. If anything isn’t fresh, is damaged or isn’t what you ordered, hand it back to the rider — we replace it at the door when we can, or refund it. No forms, no arguments.{' '}
              <Link href="/returns" className="font-semibold text-[#1a663b] hover:underline">Read the full policy</Link>.
            </p>
          </div>
        </section>

        <section className="text-center">
          <Leaf className="mx-auto h-8 w-8 text-[#1a663b]" />
          <h2 className="mt-3 font-display text-3xl font-bold text-[#112a1d]">Ready for your first basket?</h2>
          <p className="mt-2 text-[#5a7165]">Fresh produce, fish, meat, dairy and pantry staples — delivered today.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-emerald-gradient px-7 text-sm font-bold text-white shadow-glow hover:brightness-105">Start shopping</Link>
            <Link href="/delivery" className="inline-flex h-12 items-center rounded-full border-2 border-[#cce2d4] bg-white px-7 text-sm font-bold text-[#112a1d] hover:border-[#1a663b]">How delivery works</Link>
          </div>
        </section>

        <SupportCard title="Want to work with us?" />
      </InfoBody>
    </>
  );
}
