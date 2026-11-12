import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { getCategories, getCategory, getCategoryNode, getCategoryPath, getCategoryTree } from '@/lib/data/catalog';
import type { CategoryNode, CategoryWithCount } from '@/types/store';
import { SITE_URL } from '@/lib/constants';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/product/JsonLd';
import { ProductListing } from '@/components/shop/ProductListing';
import { CategoryHeroSkeleton, ListingSkeleton } from '@/components/store-ui/Skeletons';
import { parseFilters, type RawSearchParams } from '@/components/shop/params';

type Params = Promise<{ slug: string }>;
type SP = Promise<RawSearchParams>;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.length ? categories.map((c) => ({ slug: c.id })) : [{ slug: 'fruits' }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const path = await getCategoryPath(slug);
  const category = path.at(-1);
  if (!category) notFound();
  const lead = (category.description || category.blurb).replace(/[.\s]+$/, '');
  const description = `${lead ? `${lead}. ` : ''}Order ${category.name.toLowerCase()} online with same-day delivery and cash on delivery in Dhaka.`.slice(0, 300);
  const parent = path.length > 1 ? path[path.length - 2] : undefined;
  return {
    title: parent ? `${category.name} — ${parent.name} | buy online in Dhaka` : `${category.name} — buy online in Dhaka`,
    description,
    alternates: { canonical: `/category/${category.id}` },
    openGraph: {
      title: category.name,
      description,
      url: `/category/${category.id}`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default function CategoryPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Suspense fallback={<CategoryHeroSkeleton />}>
          <CategoryHero params={params} />
        </Suspense>
        <div className="mt-10">
          <Suspense fallback={<ListingSkeleton />}>
            <CategoryResults params={params} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function CategoryHero({ params }: { params: Params }) {
  const { slug } = await params;
  const [path, node, tree] = await Promise.all([getCategoryPath(slug), getCategoryNode(slug), getCategoryTree()]);
  const category = path.at(-1);
  if (!category || !node) notFound();
  const count = node.productCount;
  const parent = path.length > 1 ? path[path.length - 2] : undefined;
  const parentNode = parent ? findNode(tree, parent.id) : undefined;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            ...path.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 2,
              name: c.name,
              item: `${SITE_URL}/category/${c.id}`,
            })),
          ],
        }}
      />
      <Breadcrumbs
        items={path.map((c, i) => (i === path.length - 1 ? { label: c.name } : { label: c.name, href: `/category/${c.id}` }))}
      />

      <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-[#0f2c1d] shadow-card">
        {category.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.image} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2c1d] via-[#0f2c1d]/80 to-[#0f2c1d]/10" aria-hidden />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
          <div className="flex flex-wrap items-center gap-2">
            {parent && (
              <Link
                href={`/category/${parent.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b82e] px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-[#3a2502] transition hover:bg-[#ffc94d]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {parent.name}
              </Link>
            )}
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#b9f2cf] backdrop-blur">
              {count} {count === 1 ? 'product' : 'products'}
              {node.children.length > 0 && ` · ${node.children.length} ${node.children.length === 1 ? 'aisle' : 'aisles'}`}
            </span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{category.name}</h1>
          {category.blurb && <p className="mt-3 max-w-xl text-sm text-[#d6eadd] sm:text-lg">{category.blurb}</p>}
          {category.description && category.description !== category.blurb && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#b9d8c5]">{category.description}</p>
          )}
        </div>
      </header>

      {node.children.length > 0 ? (
        <SubcategoryCards node={node} />
      ) : parentNode ? (
        <SiblingPills parent={parentNode} current={category.id} />
      ) : (
        <TopLevelPills categories={tree} current={category.id} />
      )}
    </>
  );
}

function findNode(nodes: CategoryNode[], id: string): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return undefined;
}

const plural = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`;

/** Parent category: "All <name>" plus an image card per subcategory. */
function SubcategoryCards({ node }: { node: CategoryNode }) {
  return (
    <nav aria-label={`${node.name} subcategories`} className="mt-6">
      <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#5a7165]">Shop by type</h2>
      <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        <li className="w-36 shrink-0 snap-start sm:w-auto">
          <span
            aria-current="page"
            className="flex h-full flex-col justify-between gap-3 rounded-3xl bg-forest-gradient p-4 text-white shadow-card ring-2 ring-[#f5b82e]/70"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-[#f5b82e]">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-base font-bold leading-tight">All {node.name}</span>
              <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wider text-[#b9f2cf]">{plural(node.productCount)}</span>
            </span>
          </span>
        </li>
        {node.children.map((c) => (
          <li key={c.id} className="w-36 shrink-0 snap-start sm:w-auto">
            <Link
              href={`/category/${c.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#dfece3] bg-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-[#1a663b]/40 hover:shadow-card"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-[#f0f7f2]">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                )}
                <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#1a663b] opacity-0 shadow-sm transition group-hover:opacity-100">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </span>
              <span className="flex flex-1 flex-col p-3">
                <span className="text-sm font-bold leading-tight text-[#112a1d] group-hover:text-[#1a663b]">{c.name}</span>
                <span className="mt-auto pt-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1a663b]">{plural(c.productCount)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const pill = (on: boolean) =>
  `inline-flex h-10 items-center gap-2 rounded-full border pl-1 pr-4 text-sm font-semibold transition ${
    on ? 'border-[#1a663b] bg-[#1a663b] text-white shadow-glow' : 'border-[#cfe3d6] bg-white text-[#234835] hover:border-[#1a663b]'
  }`;

function PillImage({ src }: { src: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
  ) : (
    <span className="h-8 w-8 rounded-full bg-[#e8f5ee]" aria-hidden />
  );
}

function PillRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2 sm:flex-wrap">{children}</ul>
    </nav>
  );
}

/** Subcategory: link up to the parent plus the sibling subcategories. */
function SiblingPills({ parent, current }: { parent: CategoryNode; current: string }) {
  return (
    <PillRow label={`More in ${parent.name}`}>
      <li className="shrink-0">
        <Link href={`/category/${parent.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#cfe3d6] bg-[#f0f7f2] px-4 text-sm font-bold text-[#14522f] hover:border-[#1a663b]">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All {parent.name}
          <span className="text-xs font-semibold text-[#5a7165]">{parent.productCount}</span>
        </Link>
      </li>
      {parent.children.map((c) => {
        const on = c.id === current;
        return (
          <li key={c.id} className="shrink-0">
            <Link href={`/category/${c.id}`} aria-current={on ? 'page' : undefined} className={pill(on)}>
              <PillImage src={c.image} />
              {c.name}
              <span className={`text-xs font-semibold ${on ? 'text-[#b9f2cf]' : 'text-[#7e9688]'}`}>{c.productCount}</span>
            </Link>
          </li>
        );
      })}
    </PillRow>
  );
}

/** Top-level category without subcategories: the other top-level aisles. */
function TopLevelPills({ categories, current }: { categories: CategoryWithCount[]; current: string }) {
  return (
    <PillRow label="Other categories">
      <li className="shrink-0">
        <Link href="/shop" className="inline-flex h-10 items-center rounded-full border border-[#cfe3d6] bg-white px-4 text-sm font-semibold text-[#234835] hover:border-[#1a663b]">
          All products
        </Link>
      </li>
      {categories.map((c) => {
        const on = c.id === current;
        return (
          <li key={c.id} className="shrink-0">
            <Link href={`/category/${c.id}`} aria-current={on ? 'page' : undefined} className={pill(on)}>
              <PillImage src={c.image} />
              {c.name}
            </Link>
          </li>
        );
      })}
    </PillRow>
  );
}

async function CategoryResults({ params, searchParams }: { params: Params; searchParams: SP }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  return <ProductListing basePath={`/category/${category.id}`} filters={parseFilters(sp)} lockedCategory={category.id} />;
}
