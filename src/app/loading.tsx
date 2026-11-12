import { Block } from '@/components/ui/Skeleton';

/** Generic page skeleton for routes without their own loading UI. */
export default function Loading() {
  return (
    <div className="bg-hero-mesh" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <Block className="h-3 w-40" />
        <Block className="h-10 w-72 max-w-full" />
        <Block className="h-4 w-96 max-w-full" />
        <div className="grid gap-5 pt-4 md:grid-cols-3">
          <Block className="h-48 md:col-span-2" />
          <Block className="h-48" />
        </div>
        <Block className="h-64 w-full" />
      </div>
    </div>
  );
}
