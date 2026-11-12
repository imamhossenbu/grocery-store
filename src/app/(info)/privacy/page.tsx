import type { Metadata } from 'next';
import Link from 'next/link';
import { InfoBody, InfoHero, Prose, Toc } from '@/components/info/InfoLayout';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How FreshBasket collects, uses and protects your personal information when you shop for groceries with us in Dhaka.',
  alternates: { canonical: '/privacy' },
};

const SECTIONS = [
  { id: 'collect', label: 'What we collect' },
  { id: 'use', label: 'How we use it' },
  { id: 'share', label: 'Who we share it with' },
  { id: 'device', label: 'Cookies and your device' },
  { id: 'security', label: 'How we protect it' },
  { id: 'retention', label: 'How long we keep it' },
  { id: 'rights', label: 'Your choices and rights' },
  { id: 'changes', label: 'Changes and contact' },
];

export default function PrivacyPage() {
  return (
    <>
      <InfoHero
        crumb="Privacy policy"
        eyebrow="Legal"
        title="Privacy policy"
        intro="We collect only what we need to deliver your groceries, we never sell your data, and you can ask us to delete it at any time."
        meta="Last updated: 12 November 2026"
      />
      <InfoBody>
        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <Prose>
            <p>
              This policy explains how FreshBasket (“we”, “us”) handles personal information when you use our website, create an account or place an order for delivery in Dhaka, Bangladesh.
            </p>

            <h2 id="collect">1. What we collect</h2>
            <ul>
              <li><strong>Order details:</strong> your name, mobile number, delivery address, area, chosen delivery slot, order notes and the items you buy.</li>
              <li><strong>Account details:</strong> if you register, your email address, full name and a securely hashed password. You may also save a default phone number and address.</li>
              <li><strong>Messages:</strong> what you send through our contact form, by email or by phone, including any photos of order problems.</li>
              <li><strong>Reviews:</strong> ratings and comments you choose to publish, shown with your name.</li>
              <li><strong>Technical data:</strong> basic logs such as IP address, browser type and pages requested, kept for security and to fix errors.</li>
            </ul>
            <p>We do not collect card or mobile-wallet details on this website — all orders are paid in cash on delivery.</p>

            <h2 id="use">2. How we use it</h2>
            <ul>
              <li>To confirm, pack and deliver your order, and to call you about it.</li>
              <li>To show your order history and fill in checkout for you when you are signed in.</li>
              <li>To answer questions, process replacements and send refunds.</li>
              <li>To send our newsletter, only if you subscribed. Every email has an unsubscribe link.</li>
              <li>To prevent fraud and abuse and to keep the service secure.</li>
              <li>To understand which products and areas are popular, using aggregated figures that do not identify you.</li>
            </ul>

            <h2 id="share">3. Who we share it with</h2>
            <p>We never sell or rent your personal information. We share only what is necessary with:</p>
            <ul>
              <li><strong>Our delivery riders</strong> — your name, phone number, address and order contents, for that delivery only.</li>
              <li><strong>Service providers</strong> who host our website and database, send our emails and SMS, and process refunds via bKash or Nagad. They act on our instructions and may not use your data for their own purposes.</li>
              <li><strong>Authorities</strong> when required by Bangladeshi law or to protect our customers, riders or business from fraud or harm.</li>
            </ul>

            <h2 id="device">4. Cookies and your device</h2>
            <p>
              We use essential cookies to keep you signed in securely. Your basket, wishlist and recently viewed items are stored in your browser’s local storage on your device, not on our servers, until you place an order. We do not use advertising cookies.
            </p>

            <h2 id="security">5. How we protect it</h2>
            <p>
              Data travels over encrypted HTTPS connections. Passwords are hashed and never visible to our staff. Access to customer records is limited to team members who need it to serve you, and each customer can only see their own orders and profile.
            </p>

            <h2 id="retention">6. How long we keep it</h2>
            <p>
              We keep order records for as long as required for accounting and tax purposes under Bangladeshi law. Account and profile details are kept while your account is active. Contact messages are deleted after 2 years. Technical logs are kept for up to 90 days.
            </p>

            <h2 id="rights">7. Your choices and rights</h2>
            <ul>
              <li>View and update your name, phone and address any time in <Link href="/account/profile">your account</Link>.</li>
              <li>Change your password from <Link href="/account/security">Security</Link>.</li>
              <li>Unsubscribe from the newsletter using the link in any email.</li>
              <li>Ask for a copy of your data, or for your account to be deleted, by emailing us from your registered address. We respond within 7 days.</li>
            </ul>

            <h2 id="changes">8. Changes and contact</h2>
            <p>
              If we change this policy we will update the date at the top of this page, and tell registered customers by email about significant changes. Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call {SUPPORT_PHONE}.
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
