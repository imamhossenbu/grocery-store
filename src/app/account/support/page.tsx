import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, BookOpen, Mail, MessageSquareText, PackageSearch, Phone } from 'lucide-react';
import { ContactForm } from '@/components/info/ContactForm';
import { FAQ_GROUPS } from '@/components/info/faq-data';
import { Accordion } from '@/components/ui/Accordion';
import { SupportHeader } from '@/components/account/dashboard/headers';
import { Panel } from '@/components/account/dashboard/PageHeader';
import { SupportFormSkeleton } from '@/components/account/dashboard/skeletons';
import { getMyProfile, requireViewer } from '@/lib/data/account';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { Reveal } from '@/components/ui/motion';

export const metadata: Metadata = { title: 'Help & support' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FAQ_PICKS = FAQ_GROUPS.filter((g) => ['ordering', 'delivery', 'payment', 'returns'].includes(g.id))
  .flatMap((g) => g.items.slice(0, 2).map((item, i) => ({ id: `${g.id}-${i}`, title: item.q, content: item.a })))
  .slice(0, 7);

export default function AccountSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const channels = [
    { href: `tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`, icon: <Phone />, title: 'Call us', detail: SUPPORT_PHONE, note: '7 AM – 11 PM, every day' },
    { href: `mailto:${SUPPORT_EMAIL}`, icon: <Mail />, title: 'Email', detail: SUPPORT_EMAIL, note: 'Reply within a few hours' },
    { href: '/account/orders?status=active', icon: <PackageSearch />, title: 'Track an order', detail: 'Live status & ETA', note: 'For your active orders' },
    { href: '/faq', icon: <BookOpen />, title: 'Help centre', detail: 'All FAQs', note: 'Delivery, payment, returns' },
  ];

  return (
    <>
      <SupportHeader />
      <div className="space-y-5 lg:space-y-6">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {channels.map((c, i) => (
            <Reveal as="li" index={i} key={c.title} >
              <a href={c.href} className="fb-lift flex h-full items-start gap-3 rounded-3xl border border-[#dfece3] bg-white p-4 shadow-soft">
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f5ee] text-[#1a663b] [&>svg]:h-5 [&>svg]:w-5">{c.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#112a1d]">{c.title}</span>
                  <span className="block truncate text-sm font-semibold text-[#1a663b]">{c.detail}</span>
                  <span className="block text-[13px] text-[#3f5649]">{c.note}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </ul>

        <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[1fr_24rem]">
          <Suspense fallback={<SupportFormSkeleton />}>
            <SupportForm searchParams={searchParams} />
          </Suspense>

          <Panel
            title="Quick answers"
            icon={<MessageSquareText />}
            className="self-start"
            index={2}
            action={
              <Link href="/faq" className="inline-flex items-center gap-1 text-sm font-bold text-[#1a663b] hover:underline">
                All FAQs <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
            bodyClassName="pt-1 sm:pt-1"
          >
            <Accordion items={FAQ_PICKS} defaultOpen={[FAQ_PICKS[0]?.id ?? '']} multiple={false} />
          </Panel>
        </div>
      </div>
    </>
  );
}

async function SupportForm({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireViewer('/account/support');
  const [profile, sp] = await Promise.all([getMyProfile().catch(() => null), searchParams]);
  const order = typeof sp.order === 'string' && /^FB-\d{6}$/i.test(sp.order) ? sp.order.toUpperCase() : '';

  return (
    <Panel title="Send us a message" icon={<Mail />} className="fb-crossfade" bodyClassName="sm:p-8 sm:pt-4" index={1}>
      <p className="mb-6 text-sm leading-relaxed text-[#3f5649]">
        We’ve filled in your details. {order ? `This message is about order ${order}.` : 'Add an order number if it’s about a delivery.'}
      </p>
      <ContactForm
        defaults={{
          name: profile?.profile.fullName || viewer.fullName,
          email: viewer.email,
          phone: profile?.profile.phone ?? '',
          orderId: order,
          subject: order ? 'Question about an order' : undefined,
        }}
      />
    </Panel>
  );
}
