import { Block, ProductGridSkeleton } from '@/components/ui/Skeleton';

export function ListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10" aria-busy="true" aria-label="Loading products">
      <div className="hidden lg:block space-y-4 rounded-[1.75rem] border border-[#dfece3] bg-white p-5 shadow-soft">
        <Block className="h-3 w-20" />
        {Array.from({ length: 6 }, (_, i) => (
          <Block key={i} className="h-8 w-full" />
        ))}
        <Block className="mt-6 h-3 w-16" />
        <Block className="h-10 w-full" />
        <Block className="h-11 w-full rounded-full" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Block className="h-4 w-40" />
          <Block className="h-10 w-44 rounded-full" />
        </div>
        <div className="mt-6">
          <ProductGridSkeleton count={count} />
        </div>
      </div>
    </div>
  );
}

export function PageHeadingSkeleton() {
  return (
    <div className="space-y-3">
      <Block className="h-3 w-32" />
      <Block className="h-9 w-64" />
      <Block className="h-4 w-80 max-w-full" />
    </div>
  );
}
