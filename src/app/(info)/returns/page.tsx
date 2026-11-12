import type { Metadata } from 'next';
import Link from 'next/link';
import { Ban, CheckCircle2, Clock, RefreshCcw } from 'lucide-react';
import { InfoBody, InfoHero, Prose, SupportCard } from '@/components/info/InfoLayout';

export const metadata: Metadata = {
  title: 'Returns & refunds',
  description: 'FreshBasket freshness guarantee: check your groceries at the door and hand back anything not fresh for a replacement or refund. How to report problems after delivery.',
  alternates: { canonical: '/returns' },
};

export default function ReturnsPage() {
  return (
    <>
      <InfoHero
        crumb="Returns & refunds"
        eyebrow="Freshness guarantee"
        title="Not fresh? We’ll make it right."
        intro="Food should be good enough to serve your family. If anything in your order isn’t, we replace it or refund it — starting right at your door."
        meta="Last updated: 12 November 2026"
      />
      <InfoBody className="space-y-12">
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: CheckCircle2, title: 'At the door', text: 'Hand back anything not fresh or damaged. Replaced on the spot when the rider has stock, otherwise not charged.' },
            { icon: Clock, title: 'Within 24 hours', text: 'Found a problem with fresh, chilled or frozen food later? Tell us within 24 hours of delivery.' },
            { icon: RefreshCcw, title: 'Within 7 days', text: 'Sealed packaged goods that are damaged, expired or wrong can be reported within 7 days.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl border border-[#dfece3] bg-white p-6 shadow-soft">
              <Icon className="h-6 w-6 text-[#1a663b]" />
              <h2 className="mt-3 font-bold text-[#112a1d]">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#5a7165]">{text}</p>
            </li>
          ))}
        </ul>

        <Prose>
          <h2>1. Check your order at the door</h2>
          <p>
            Because you pay on delivery, you can inspect everything before paying. If an item is bruised, wilted, spoiled, leaking, past its date or simply not what you ordered, give it back to the rider. You only pay for what you keep. If the rider is carrying a spare of the same item, they replace it on the spot.
          </p>

          <h2>2. Problems found after delivery</h2>
          <p>Sometimes an issue only shows up when you open a pack or start cooking. Contact us with your order number and, if possible, a photo:</p>
          <ul>
            <li><strong>Fruit, vegetables, fish, meat, dairy, bakery, chilled and frozen items:</strong> within 24 hours of delivery.</li>
            <li><strong>Sealed packaged goods</strong> (rice, oil, spices, snacks, household items): within 7 days, unopened unless the fault was only visible after opening.</li>
          </ul>
          <p>
            You do not usually need to return fresh food — a photo is enough. We will either send a replacement with your next order or refund you, whichever you prefer.
          </p>

          <h2>3. How refunds are paid</h2>
          <p>
            Orders are paid in cash, so refunds are sent by <strong>bKash or Nagad</strong> to the mobile number on your order, or taken off your next order as credit. Approved refunds are processed within 2 working days. We will never ask for your PIN or OTP.
          </p>

          <h2>4. Cancelling an order</h2>
          <p>
            You can cancel free of charge until your order is packed — call us with your order number. Once it is out for delivery, you can still refuse it at the door; repeated refusals without a reason may mean we ask for confirmation by phone before accepting future orders.
          </p>

          <h2>5. What we can’t take back</h2>
          <ul>
            <li>Items you accepted at the door that were damaged after delivery or not stored as instructed.</li>
            <li>Fresh food reported more than 24 hours after delivery, or packaged goods after 7 days.</li>
            <li>Opened packaged goods where the problem is a change of mind rather than a fault.</li>
          </ul>
          <p>
            This policy does not affect your rights under the Consumer Rights Protection Act, 2009 of Bangladesh.
          </p>
        </Prose>

        <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <Ban className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Beware of anyone claiming to be FreshBasket who asks for payment details or a bKash PIN to “process a refund”. We only ever send refunds to you — never ask you to send money. Report anything suspicious via our <Link href="/contact" className="font-semibold underline">contact page</Link>.
          </p>
        </div>

        <SupportCard title="Report a problem with an order" />
      </InfoBody>
    </>
  );
}
