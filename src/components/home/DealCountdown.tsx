'use client';

import { useEffect, useState } from 'react';

/** Milliseconds until the next midnight in Dhaka (UTC+6, no DST). */
function msToDhakaMidnight(now: number): number {
  const offset = 6 * 60 * 60 * 1000;
  const local = now + offset;
  const nextMidnight = Math.floor(local / 86_400_000 + 1) * 86_400_000;
  return nextMidnight - local;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "Today's deals end in HH:MM:SS" — rendered client-side only (time-dependent). */
export function DealCountdown() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(msToDhakaMidnight(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const s = left === null ? null : Math.floor(left / 1000);
  const parts = s === null ? ['--', '--', '--'] : [pad(Math.floor(s / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];

  return (
    <div className="flex items-center gap-2" role="timer" aria-label="Time left on today's deals">
      <span className="text-xs font-bold uppercase tracking-widest text-[#b9d8c5]">Ends in</span>
      <span className="flex items-center gap-1 font-mono text-sm font-extrabold tabular-nums text-[#0f2c1d]">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="rounded-lg bg-[#f5b82e] px-2 py-1">{p}</span>
            {i < 2 && <span className="text-[#f5b82e]">:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}
