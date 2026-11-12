'use client';

import { useState } from 'react';
import { ZoomIn } from 'lucide-react';

interface Props {
  images: string[];
  name: string;
  badges?: React.ReactNode;
}

/** Main image + thumbnails. Desktop (mouse) hover zooms in and follows the cursor. */
export function ProductGallery({ images, name, badges }: Props) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const src = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-[2rem] border border-[#dfece3] bg-[#f0f7f2] shadow-soft lg:flex-1"
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={images.length > 1 ? `${name} — image ${active + 1} of ${images.length}` : name}
          fetchPriority="high"
          className="h-full w-full object-cover transition-transform duration-200 ease-out"
          style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-2">{badges}</div>
        <span className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#234835] shadow-sm backdrop-blur transition group-hover:opacity-0 [@media(hover:hover)]:inline-flex">
          <ZoomIn className="h-3.5 w-3.5" /> Hover to zoom
        </span>
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2.5 overflow-x-auto pb-1 lg:w-20 lg:flex-col lg:overflow-visible" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img + i} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`block h-16 w-16 overflow-hidden rounded-2xl border-2 bg-[#f0f7f2] transition sm:h-20 sm:w-20 cursor-pointer ${
                  i === active ? 'border-[#1a663b] shadow-glow' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
