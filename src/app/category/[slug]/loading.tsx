import { Block } from '@/components/ui/Skeleton';
import { ListingSkeleton } from '@/components/shop/ListingSkeleton';

export default function Loading() {
  return (
    <div className="bg-hero-mesh">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Block className="h-3 w-40" />
        <Block className="mt-4 h-56 w-full rounded-[2rem] sm:h-64" />
        <div className="mt-10">
          <ListingSkeleton />
        </div>
      </div>
    </div>
  );
}
