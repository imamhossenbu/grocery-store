import { ListingSkeleton, PageHeadingSkeleton } from '@/components/shop/ListingSkeleton';

export default function Loading() {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <PageHeadingSkeleton />
        </div>
        <ListingSkeleton />
      </div>
    </div>
  );
}
