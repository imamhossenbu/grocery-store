import { Star } from 'lucide-react';

/** Read-only star rating with partial fill (works in server and client components). */
export function Stars({ rating, size = 'sm', className = '' }: { rating: number; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const px = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }[size];
  const value = Math.max(0, Math.min(5, rating));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={`relative inline-block ${px}`} aria-hidden>
            <Star className={`absolute inset-0 ${px} text-[#e3d9bf]`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${px} fill-[#f5b82e] text-[#f5b82e]`} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
