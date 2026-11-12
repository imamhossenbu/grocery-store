import { Block } from '@/components/ui/Skeleton';

export function ProductDetailSkeleton() {
  return (
    <div className="bg-hero-mesh" aria-busy="true" aria-label="Loading product">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Block className="h-3 w-56" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Block className="aspect-square w-full rounded-[2rem]" />
          <div className="space-y-4">
            <Block className="h-6 w-28 rounded-full" />
            <Block className="h-10 w-4/5" />
            <Block className="h-4 w-48" />
            <div className="space-y-4 rounded-3xl border border-[#dfece3] bg-white p-5">
              <Block className="h-10 w-40" />
              <Block className="h-4 w-56" />
              <Block className="h-12 w-44 rounded-full" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Block className="h-12 rounded-full" />
                <Block className="h-12 rounded-full" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Block key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>
        <Block className="mt-14 h-56 w-full rounded-[2rem]" />
      </div>
    </div>
  );
}
