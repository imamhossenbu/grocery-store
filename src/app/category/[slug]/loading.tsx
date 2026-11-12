import { CategoryHeroSkeleton, ListingSkeleton } from '@/components/store-ui/Skeletons';

export default function Loading() {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <CategoryHeroSkeleton />
        <div className="mt-10">
          <ListingSkeleton />
        </div>
      </div>
    </div>
  );
}
