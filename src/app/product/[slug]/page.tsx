import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Banknote, Clock, Leaf, MapPin, RotateCcw, ShieldCheck, Tag, Truck } from 'lucide-react';
import { getAllProducts, getCategoryPath, getProduct, getProductReviews, getRelatedProducts } from '@/lib/data/catalog';
import { formatBDT } from '@/lib/format';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, discountPercent } from '@/lib/pricing';
import { DELIVERY_SLOTS, SITE_NAME, SITE_URL } from '@/lib/constants';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { ProductTabs } from '@/components/product/ProductTabs';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { ReviewsSection, reviewStats } from '@/components/product/ReviewsSection';
import { Stars } from '@/components/product/Stars';
import { TrackView } from '@/components/product/TrackView';
import { JsonLd } from '@/components/product/JsonLd';
import { ProductDetailSkeleton } from '@/components/product/ProductDetailSkeleton';

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.length ? products.map((p) => ({ slug: p.id })) : [{ slug: 'placeholder' }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.active) notFound();
  const path = await getCategoryPath(product.category);
  const pct = discountPercent(product.price, product.oldPrice);
  const title = `${product.name} (${product.unit})`;
  const description =
    `${formatBDT(product.price)}${pct ? ` (${pct}% off)` : ''} · ${product.description}`.slice(0, 158);
  const images = [{ url: product.image, alt: product.name }];
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.id}` },
    keywords: [product.name, ...path.map((c) => c.name), ...(product.tags ?? []), 'Dhaka grocery delivery'].filter(Boolean),
    openGraph: { type: 'website', title, description, url: `/product/${product.id}`, images },
    twitter: { card: 'summary_large_image', title, description, images: [product.image] },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.active) notFound();

  const [path, reviews, related] = await Promise.all([
    getCategoryPath(product.category),
    getProductReviews(product.id),
    getRelatedProducts(product, 4),
  ]);

  const category = path.at(-1);
  const pct = discountPercent(product.price, product.oldPrice);
  const saved = pct ? product.oldPrice! - product.price : 0;
  const out = product.stock <= 0;
  const low = !out && product.stock <= 20;
  const images = [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))];
  const { count, average } = reviewStats(product, reviews);
  const url = `${SITE_URL}/product/${product.id}`;

  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    sku: product.sku || product.id,
    category: path.length ? path.map((c) => c.name).join(' > ') : undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BDT',
      price: product.price.toFixed(2),
      availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };
  if (count > 0) {
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: average.toFixed(1),
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    };
    productLd.review = reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.authorName },
      datePublished: r.createdAt.slice(0, 10),
      reviewBody: r.comment,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    }));
  }

  // Home › Fruits › Local fruits › Product (falls back to Shop when uncategorised).
  const crumbs: { label: string; href?: string }[] = [
    ...(path.length ? path.map((c) => ({ label: c.name, href: `/category/${c.id}` })) : [{ label: 'Shop', href: '/shop' }]),
    { label: product.name },
  ];
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ label: 'Home', href: '/' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${c.href ?? `/product/${product.id}`}`,
    })),
  };

  const deliveryContent = (
    <div className="grid gap-4 text-sm leading-relaxed text-[#234835] sm:grid-cols-2">
      <div>
        <h3 className="font-bold text-[#112a1d]">Delivery</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Same-day delivery across Dhaka for orders placed before 3 PM.</li>
          <li>
            Free delivery on orders over {formatBDT(FREE_DELIVERY_THRESHOLD)}; otherwise a flat {formatBDT(DELIVERY_FEE)} fee.
          </li>
          <li>Choose a slot: {DELIVERY_SLOTS.map((s) => `${s.label} (${s.time})`).join(', ')}.</li>
          <li>Pay in cash when your groceries arrive — inspect before you pay.</li>
        </ul>
        <Link href="/delivery" className="mt-2 inline-block font-semibold text-[#1a663b] hover:underline">
          Delivery information
        </Link>
      </div>
      <div>
        <h3 className="font-bold text-[#112a1d]">Returns &amp; freshness guarantee</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Not fresh or damaged? Return it to the rider at the door, or tell us within 24 hours.</li>
          <li>We replace the item or credit your next order — no questions asked.</li>
        </ul>
        <Link href="/returns" className="mt-2 inline-block font-semibold text-[#1a663b] hover:underline">
          Returns policy
        </Link>
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'description',
      label: 'Description',
      content: (
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-[#234835] sm:text-base">
          <p>{product.description}</p>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 rounded-2xl bg-[#f0f7f2] p-5 text-sm sm:grid-cols-2">
            {[
              ['Pack size', product.unit],
              ['Category', path.length ? path.map((c) => c.name).join(' › ') : product.category],
              ['Origin', product.origin],
              ['SKU', product.sku],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[#dfece3] py-1.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                  <dt className="text-[#5a7165]">{k}</dt>
                  <dd className="text-right font-semibold text-[#112a1d]">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      ),
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      content: (
        <div className="max-w-3xl text-sm leading-relaxed text-[#234835] sm:text-base">
          {product.nutrition ? (
            <ul className="space-y-2">
              {product.nutrition
                .split(/,|&| and /)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <Leaf className="mt-1 h-4 w-4 shrink-0 text-[#1a663b]" aria-hidden /> {s}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-[#5a7165]">Detailed nutrition information is not available for this item yet.</p>
          )}
          <p className="mt-4 text-xs text-[#7e9688]">Values are indicative and vary naturally between harvests.</p>
        </div>
      ),
    },
    { id: 'delivery', label: 'Delivery & returns', content: deliveryContent },
  ];

  return (
    <div className="bg-hero-mesh">
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <TrackView product={product} />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery
            images={images}
            name={product.name}
            badges={
              <>
                {product.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1a663b] shadow-sm">
                    <Leaf className="h-3 w-3 text-[#1a663b]" /> {product.badge}
                  </span>
                )}
                {pct > 0 && (
                  <span className="rounded-full bg-[#f5b82e] px-3 py-1 text-xs font-extrabold text-[#3a2502] shadow-sm">-{pct}%</span>
                )}
              </>
            }
          />

          <div>
            {path.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {path.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.id}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest hover:border-[#1a663b] ${
                      i === path.length - 1 ? 'border-[#c5e5d2] bg-[#e5f4eb] text-[#165b34]' : 'border-[#dfece3] bg-white text-[#5a7165]'
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-[#112a1d] sm:text-4xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a href="#reviews" className="inline-flex items-center gap-2 hover:underline">
                <Stars rating={count > 0 ? average : product.rating} />
                <span className="font-bold text-[#112a1d]">{(count > 0 ? average : product.rating).toFixed(1)}</span>
                <span className="text-[#5a7165]">{count > 0 ? `(${count} ${count === 1 ? 'review' : 'reviews'})` : 'Be the first to review'}</span>
              </a>
              {(product.soldCount ?? 0) > 0 && (
                <span className="text-[#5a7165]">
                  <strong className="text-[#112a1d]">{product.soldCount!.toLocaleString('en-IN')}</strong> sold
                </span>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="font-display text-4xl font-bold text-[#1a663b]">{formatBDT(product.price)}</span>
                {pct > 0 && <span className="pb-1 text-lg text-[#7e9688] line-through">{formatBDT(product.oldPrice!)}</span>}
                <span className="pb-1.5 text-sm text-[#5a7165]">/ {product.unit}</span>
              </div>
              {pct > 0 && (
                <p className="mt-2 inline-flex rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-extrabold text-[#78350f]">
                  You save {formatBDT(saved)} ({pct}%)
                </p>
              )}
              <p
                className={`mt-3 flex items-center gap-2 text-sm font-bold ${out ? 'text-red-600' : low ? 'text-amber-700' : 'text-emerald-700'}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${out ? 'bg-red-500' : low ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} aria-hidden />
                {out ? 'Out of stock — check back tomorrow morning' : low ? `Only ${product.stock} left in stock — order soon` : 'In stock, ready for same-day delivery'}
              </p>

              <div className="mt-5">
                <ProductPurchasePanel product={product} />
              </div>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Truck,
                  title: `Free delivery over ${formatBDT(FREE_DELIVERY_THRESHOLD)}`,
                  text: `Flat ${formatBDT(DELIVERY_FEE)} below that, anywhere in Dhaka.`,
                },
                { icon: Clock, title: 'Same-day slots', text: DELIVERY_SLOTS.map((s) => s.time).join(' · ') },
                { icon: Banknote, title: 'Cash on delivery', text: 'Check your groceries, then pay at the door.' },
                { icon: RotateCcw, title: 'Freshness guarantee', text: 'Easy replacement or credit within 24 hours.' },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3 rounded-2xl border border-[#dfece3] bg-white/80 p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e8f5ee] text-[#1a663b]">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#112a1d]">{title}</span>
                    <span className="block text-xs text-[#5a7165]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 text-sm">
              {product.origin && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#1a663b]" aria-hidden />
                  <dt className="text-[#5a7165]">Origin:</dt>
                  <dd className="font-semibold text-[#112a1d]">{product.origin}</dd>
                </div>
              )}
              {product.sku && (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#1a663b]" aria-hidden />
                  <dt className="text-[#5a7165]">SKU:</dt>
                  <dd className="font-mono text-xs font-semibold text-[#112a1d]">{product.sku}</dd>
                </div>
              )}
              {(product.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-4 w-4 text-[#1a663b]" aria-hidden />
                  <dt className="text-[#5a7165]">Tags:</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {product.tags!.map((t) => (
                      <Link
                        key={t}
                        href={`/search?q=${encodeURIComponent(t)}`}
                        className="rounded-full bg-[#f0f7f2] px-2.5 py-0.5 text-xs font-semibold text-[#1a663b] hover:bg-[#e3f5ea]"
                      >
                        #{t}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-14 rounded-[2rem] border border-[#dfece3] bg-white p-5 shadow-soft sm:p-8">
          <ProductTabs tabs={tabs} />
        </div>

        <div className="mt-14">
          <ReviewsSection product={product} reviews={reviews} />
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="related-heading" className="font-display text-3xl font-bold text-[#112a1d]">
                You may also like
              </h2>
              {category && (
                <Link href={`/category/${category.id}`} className="text-sm font-bold text-[#1a663b] hover:underline">
                  More {category.name.toLowerCase()} →
                </Link>
              )}
            </div>
            <div className="mt-6">
              <ProductGrid products={related} />
            </div>
          </section>
        )}

        <RecentlyViewed excludeId={product.id} className="mt-16" />
      </div>
    </div>
  );
}
