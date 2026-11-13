import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ShopProvider } from '@/context/ShopContext';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { MotionProvider } from '@/components/ui/motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Toaster } from '@/components/layout/Toaster';
import { DatabaseNotice } from '@/components/layout/DatabaseNotice';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Fresh Groceries & Organic Food Delivery in Dhaka`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Shop fresh fruits, vegetables, farm milk, Bogura doi, fish, meat and organic foods with same-day delivery and cash on delivery across Dhaka.',
  keywords: ['online grocery dhaka', 'fresh grocery bangladesh', 'organic food dhaka', 'cash on delivery grocery'],
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_BD' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#1a663b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased ${jakarta.variable} ${fraunces.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-[#f9fbf9] text-[#112a1d]">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-card">
          Skip to content
        </a>
        <MotionProvider>
          <ShopProvider>
            <ConfirmProvider>
              <DatabaseNotice />
              <Header />
              <main id="main" className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <Toaster />
            </ConfirmProvider>
          </ShopProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
