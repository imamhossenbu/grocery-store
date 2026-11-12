export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[1.75rem] border border-[#e2efe6] bg-white shadow-soft animate-pulse">
      <div className="aspect-square w-full bg-[#e8f2ec]" />
      <div className="p-4 space-y-2.5">
        <div className="flex justify-between"><div className="h-3 w-14 rounded-full bg-[#e8f2ec]" /><div className="h-3 w-10 rounded-full bg-[#e8f2ec]" /></div>
        <div className="h-4 w-4/5 rounded-lg bg-[#dcebe2]" />
        <div className="h-4 w-1/2 rounded-lg bg-[#eef5f0]" />
        <div className="h-10 w-full rounded-full bg-[#dcebe2] mt-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function Block({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#e8f2ec] ${className}`} />;
}
