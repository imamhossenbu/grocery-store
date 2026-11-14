import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoBody, InfoHero, Prose, Toc } from '@/components/info/InfoLayout';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { formatBDT } from '@/lib/format';
import { dhakaFeeSentence } from '@/lib/pricing';
import { getDeliverySettings } from '@/lib/data/settings';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms that apply when you shop with FreshBasket: orders, pricing, same-day delivery in Dhaka, cash on delivery, returns and accounts.',
  alternates: { canonical: '/terms' },
};

const SECTIONS = [
  { id: 'about', label: 'About these terms' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'orders', label: 'Orders and availability' },
  { id: 'prices', label: 'Prices and coupons' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'returns', label: 'Returns and refunds' },
  { id: 'use', label: 'Using the website' },
  { id: 'liability', label: 'Liability' },
  { id: 'law', label: 'Governing law and contact' },
];

export default async function TermsPage() {
  const delivery = await getDeliverySettings();
  return (
    <>
      <InfoHero
        crumb="Terms of service"
        eyebrow="Legal"
        title="Terms of service"
        intro="Plain-language terms for ordering groceries from FreshBasket. By placing an order or creating an account you agree to them."
        meta="Last updated: 12 November 2026"
      />
      <InfoBody>
        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <Prose>
            <h2 id="about">1. About these terms</h2>
            <p>
              These terms apply to purchases made on the FreshBasket website by customers in Dhaka, Bangladesh. Please also read our <Link href="/privacy">privacy policy</Link> and <Link href="/returns">returns policy</Link>, which form part of these terms.
            </p>

            <h2 id="accounts">2. Accounts</h2>
            <ul>
              <li>You can order as a guest or with a free account. You must be at least 18, or ordering with a parent’s or guardian’s permission.</li>
              <li>Keep your password private. You are responsible for orders placed from your account; tell us immediately if you think someone else has access.</li>
              <li>Give accurate details — especially your phone number and address — so we can deliver.</li>
              <li>We may suspend accounts used for fraud, abuse of coupons, or repeated refusal of orders without reason.</li>
            </ul>

            <h2 id="orders">3. Orders and availability</h2>
            <p>
              When you place an order we check stock and confirm it. Your order is a request to buy; a contract is formed when we confirm it. If an item becomes unavailable or fails our quality check before dispatch, we will contact you to offer a substitute or remove it, and you will not be charged for it. Product images are illustrative — fresh produce varies naturally in size, shape and colour, and weights shown are approximate for items sold by the piece.
            </p>

            <h2 id="prices">4. Prices and coupons</h2>
            <ul>
              <li>All prices are in Bangladeshi Taka (৳) and include applicable VAT.</li>
              <li>Prices can change, but the price confirmed when you place your order is the price you pay.</li>
              <li>Coupons have the conditions shown with them (minimum order, expiry, usage limit). One coupon per order; coupons have no cash value.</li>
              <li>If an item is listed at an obviously wrong price because of an error, we will contact you before delivery and you may cancel.</li>
            </ul>

            <h2 id="delivery">5. Delivery</h2>
            <p>
              We deliver within Dhaka city on the same day in the slot you select: 8–11 AM, 1–4 PM or 5–8 PM. Delivery within Dhaka is {dhakaFeeSentence(delivery)}. Slots are estimates — traffic, weather, hartals and public holidays can cause delays, and we will let you know. Someone aged 18 or over should be available to receive the order. See <Link href="/delivery">delivery information</Link> for details.
            </p>

            <h2 id="payment">6. Payment</h2>
            <p>
              Payment is cash on delivery. Please pay the rider the exact total shown on your order after checking your items. Riders cannot accept cheques or card payments.
            </p>

            <h2 id="returns">7. Returns and refunds</h2>
            <p>
              Our freshness guarantee lets you hand back unsatisfactory items at the door and report problems within 24 hours (fresh, chilled and frozen food) or 7 days (sealed packaged goods). Refunds are made by bKash, Nagad or as credit on your next order. Full details are in our <Link href="/returns">returns policy</Link>.
            </p>

            <h2 id="use">8. Using the website</h2>
            <ul>
              <li>Do not misuse the website: no attempts to access other customers’ data, disrupt the service, scrape it at scale or place fake orders.</li>
              <li>Reviews must be honest, about products you have used, and free of abusive or misleading content. We may remove reviews that break these rules.</li>
              <li>The FreshBasket name, logo, photos and text belong to us and may not be reused without permission.</li>
            </ul>

            <h2 id="liability">9. Liability</h2>
            <p>
              We take care to describe products accurately and to deliver them safely. Our responsibility for any order is limited to replacing the affected items or refunding what you paid for them, except where the law does not allow this limit — for example, for harm caused by our negligence. Always read product labels for allergens and storage instructions. Nothing in these terms limits your rights under the Consumer Rights Protection Act, 2009.
            </p>

            <h2 id="law">10. Governing law and contact</h2>
            <p>
              These terms are governed by the laws of Bangladesh, and the courts of Dhaka have jurisdiction. We may update these terms; the version shown when you place an order applies to that order. Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call {SUPPORT_PHONE}, 7 AM – 11 PM every day.
            </p>
          </Prose>
          <div className="hidden lg:block">
            <div className="sticky top-40"><Toc items={SECTIONS} /></div>
          </div>
        </div>
      </InfoBody>
    </>
  );
}
