import Link from 'next/link';
import { Banknote, Leaf, Mail, MapPin, Phone } from 'lucide-react';
import { getTopCategories } from '@/lib/data/catalog';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants';
import { NewsletterForm } from './NewsletterForm';

export async function Footer() {
  const categories = await getTopCategories();
  return (
    <footer className="mt-auto bg-[#091e13] text-[#b9d8c5]">
      <div className="border-b border-[#163f29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Fresh deals in your inbox</h2>
            <p className="mt-1 text-sm text-[#9abda9]">Weekly offers and seasonal harvest alerts. No spam, unsubscribe any time.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-emerald-gradient text-white"><Leaf className="w-5 h-5" /></span>
            <span className="font-display text-2xl font-bold text-white">Fresh<span className="text-[#3ed481]">Basket</span></span>
          </Link>
          <p className="text-sm leading-relaxed text-[#9abda9] max-w-sm">
            Online grocery connecting Bangladeshi farmers with households: honest prices, quality checked every morning, cash on delivery.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#3ed481]" /> Dhaka Delivery Hub, Bangladesh</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#3ed481]" /> <a href={`tel:${SUPPORT_PHONE.replace(/[\s-]/g, '')}`} className="hover:text-white">{SUPPORT_PHONE}</a></li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#3ed481]" /> <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">{SUPPORT_EMAIL}</a></li>
          </ul>
        </div>
        <FooterCol title="Shop" links={[['/shop', 'All products'], ['/deals', 'Deals & offers'], ...categories.slice(0, 4).map((c) => [`/category/${c.id}`, c.name] as [string, string])]} />
        <FooterCol title="Help" links={[['/track-order', 'Track order'], ['/delivery', 'Delivery info'], ['/returns', 'Returns & refunds'], ['/faq', 'FAQ'], ['/contact', 'Contact us']]} />
        <FooterCol title="Company" links={[['/about', 'About us'], ['/account', 'My account'], ['/privacy', 'Privacy policy'], ['/terms', 'Terms of service']]} />
      </div>
      <div className="border-t border-[#163f29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#789d87]">
          <p>© 2026 FreshBasket Bangladesh. All rights reserved.</p>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#123824] px-3 py-1 border border-[#1b5034] text-[#ecfdf5]">
            <Banknote className="w-3.5 h-3.5 text-[#f5b82e]" /> Cash on delivery
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-display text-base font-bold text-white mb-4">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="hover:text-white transition">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
