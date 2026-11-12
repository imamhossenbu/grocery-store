import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'FreshBasket — Fresh Groceries & Organic Food Delivery in Bangladesh',
  description:
    'Shop fresh fruits, crisp vegetables, farm milk, sweet Bogura doi, and organic foods with 100% Cash on Delivery across Dhaka.',
  keywords: [
    'grocery',
    'fresh grocery bangladesh',
    'organic food dhaka',
    'cash on delivery grocery',
    'himsagar mango',
    'farm fresh milk',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
