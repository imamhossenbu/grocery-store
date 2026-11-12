import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-[#e2efe6] bg-white p-3.5 shadow-soft animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-[#e8f2ec]" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-16 rounded-full bg-[#e8f2ec]" />
        <div className="h-3 w-10 rounded-full bg-[#e8f2ec]" />
      </div>
      <div className="mt-2.5 h-5 w-3/4 rounded-lg bg-[#dcebe2]" />
      <div className="mt-2 h-3.5 w-full rounded-lg bg-[#eef5f0]" />
      <div className="mt-1.5 h-3.5 w-2/3 rounded-lg bg-[#eef5f0]" />
      <div className="mt-5 flex items-center justify-between pt-2">
        <div className="h-6 w-20 rounded-lg bg-[#dcebe2]" />
        <div className="h-4 w-16 rounded-full bg-[#e8f2ec]" />
      </div>
      <div className="mt-3 h-10 w-full rounded-full bg-[#dcebe2]" />
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="rounded-3xl border border-[#e2efe6] bg-white p-3.5 shadow-soft animate-pulse">
      <div className="aspect-square rounded-2xl bg-[#e8f2ec]" />
      <div className="mt-3 mx-auto h-4 w-24 rounded-full bg-[#dcebe2]" />
      <div className="mt-1.5 mx-auto h-3 w-32 rounded-full bg-[#eef5f0]" />
    </div>
  );
}

