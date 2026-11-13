import { Block } from '@/components/ui/Skeleton';

export function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]" aria-busy="true" aria-label="Loading checkout">
      <div className="space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-4 rounded-3xl border border-[#dfece3] bg-white p-6">
            <Block className="h-6 w-48" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Block className="h-12" />
              <Block className="h-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden space-y-4 lg:block">
        <Block className="h-20" />
        <Block className="h-96" />
      </div>
    </div>
  );
}
