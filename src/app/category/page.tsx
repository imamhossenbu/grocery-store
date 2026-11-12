import type { Metadata } from 'next';
import { getCategories } from '@/lib/data/catalog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryGrid } from '@/components/home/CategoryGrid';

export const metadata: Metadata = {
  title: 'All categories',
  description: 'Browse every FreshBasket aisle: fruits, vegetables, dairy & eggs, organic food, daily grocery, fish & meat.',
  alternates: { canonical: '/category' },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Categories' }]} />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#112a1d] sm:text-4xl">All categories</h1>
        <p className="mt-2 mb-8 max-w-2xl text-sm text-[#5a7165] sm:text-base">Pick an aisle to start filling your basket.</p>
        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}
