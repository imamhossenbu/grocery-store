'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { formatBDT } from '@/lib/format';
import type { MonthPoint } from '@/lib/account-stats';

const HEIGHT = 220;
const PAD = { top: 16, right: 8, bottom: 28, left: 52 };

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

function shortBDT(v: number) {
  if (v >= 100000) return `৳${(v / 100000).toFixed(v % 100000 ? 1 : 0)}L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k`;
  return `৳${v}`;
}

/**
 * Six-month spending bar chart (single series, so no legend: the title
 * names it). Inline SVG drawn at the container's real pixel width so text
 * never scales; hover or focus a bar for its tooltip, ←/→ move between
 * bars; a table view and a text summary carry the same numbers.
 */
export function SpendingChart({ points }: { points: MonthPoint[] }) {
  const [view, setView] = useState('chart');
  const total = points.reduce((s, p) => s + p.spent, 0);
  const best = points.reduce((a, b) => (b.spent > a.spent ? b : a), points[0]);
  const current = points[points.length - 1];
  const previous = points[points.length - 2];
  const change = previous && previous.spent > 0 ? Math.round(((current.spent - previous.spent) / previous.spent) * 100) : null;

  const summary =
    total === 0
      ? 'No spending in the last six months.'
      : `You spent ${formatBDT(total)} over the last six months. Highest month: ${best.longLabel} at ${formatBDT(best.spent)}. This month so far: ${formatBDT(current.spent)}.`;

  return (
    <section aria-labelledby="spend-title" className="h-full rounded-3xl border border-[#dfece3] bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="spend-title" className="font-display text-lg font-bold text-[#112a1d] sm:text-xl">Spending, last 6 months</h2>
          <p className="mt-0.5 text-sm text-[#3f5649]">
            <span className="font-extrabold text-[#112a1d]">{formatBDT(total)}</span> total
            {change !== null && (
              <>
                {' · '}
                <span className={change > 0 ? 'font-semibold text-amber-700' : 'font-semibold text-[#1a663b]'}>
                  {change > 0 ? '▲' : change < 0 ? '▼' : ''} {Math.abs(change)}%
                </span>{' '}
                vs last month
              </>
            )}
          </p>
        </div>
        <Tabs
          idBase="spend"
          aria-label="Spending view"
          value={view}
          onValueChange={setView}
          items={[
            { value: 'chart', label: 'Chart', icon: <BarChart3 /> },
            { value: 'table', label: 'Table', icon: <Table2 /> },
          ]}
        />
      </div>
      <p className="sr-only">{summary}</p>
      <TabPanel idBase="spend" value={view} className="mt-4">
        {view === 'chart' ? <Bars points={points} /> : <SpendTable points={points} />}
      </TabPanel>
    </section>
  );
}

function Bars({ points }: { points: MonthPoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(...points.map((p) => p.spent)));
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / points.length;
  const barW = Math.min(44, band * 0.56);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = active ?? points.length - 1;
    const next = e.key === 'ArrowRight' ? Math.min(points.length - 1, i + 1) : Math.max(0, i - 1);
    setActive(next);
    wrapRef.current?.querySelector<SVGGElement>(`[data-bar="${next}"]`)?.focus();
  };

  const tip = active !== null ? points[active] : null;
  const tipLeft = active !== null ? Math.min(Math.max(PAD.left + band * active + band / 2, 70), width - 70) : 0;
  const tipTop = tip ? Math.max(y(tip.spent) - 8, 52) : 0;

  return (
    <div ref={wrapRef} className="relative" style={{ height: HEIGHT }} onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="group" aria-label="Monthly spending bars" onKeyDown={onKey} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t} aria-hidden="true">
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#cfe0d6' : '#edf3ef'} strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[#3f5649] text-xs tabular-nums">
                {shortBDT(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const cx = PAD.left + band * i + band / 2;
            const top = y(p.spent);
            const h = Math.max(0, PAD.top + plotH - top);
            const r = Math.min(4, h / 2, barW / 2);
            const x0 = cx - barW / 2;
            const base = PAD.top + plotH;
            const isActive = active === i;
            const isCurrent = i === points.length - 1;
            const d = h > 0 ? `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z` : '';
            return (
              <g
                key={p.key}
                data-bar={i}
                tabIndex={i === (active ?? points.length - 1) ? 0 : -1}
                role="img"
                aria-label={`${p.longLabel}: ${formatBDT(p.spent)} across ${p.orders} order${p.orders === 1 ? '' : 's'}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none [&:focus-visible>rect.hit]:stroke-[#1a663b]"
              >
                <rect className="hit" x={PAD.left + band * i + 2} y={PAD.top} width={band - 4} height={plotH} rx={10} fill={isActive ? '#f2f8f4' : 'transparent'} strokeWidth={2} stroke="transparent" />
                {d && (
                  <motion.path
                    d={d}
                    fill={isCurrent ? '#1a663b' : isActive ? '#2a8a52' : '#7fbf98'}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.06 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                    className="transition-[fill]"
                  />
                )}
                {p.spent === 0 && <line x1={x0} x2={x0 + barW} y1={base - 1} y2={base - 1} stroke="#cfe0d6" strokeWidth={2} strokeLinecap="round" />}
                <text x={cx} y={HEIGHT - 8} textAnchor="middle" className={`text-xs ${isCurrent ? 'fill-[#112a1d] font-bold' : 'fill-[#3f5649]'}`} aria-hidden="true">
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <AnimatePresence>
      {tip && width > 0 && (
        <motion.div
          key="tip"
          aria-hidden="true"
          initial={{ opacity: 0, left: tipLeft, top: tipTop }}
          animate={{ opacity: 1, left: tipLeft, top: tipTop }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-[#0f2c1d] px-3 py-2 text-[13px] text-white shadow-card"
        >
          <p className="font-bold">{tip.longLabel}</p>
          <p className="mt-0.5 tabular-nums">
            <span className="font-extrabold text-[#f5b82e]">{formatBDT(tip.spent)}</span> · {tip.orders} order{tip.orders === 1 ? '' : 's'}
          </p>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function SpendTable({ points }: { points: MonthPoint[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eef5f0]" style={{ minHeight: HEIGHT }}>
      <table className="w-full text-sm">
        <caption className="sr-only">Spending per month, last six months</caption>
        <thead className="bg-[#f6faf7] text-left text-[13px] font-semibold text-[#3f5649]">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-bold">Month</th>
            <th scope="col" className="px-4 py-2.5 text-right font-bold">Orders</th>
            <th scope="col" className="px-4 py-2.5 text-right font-bold">Spent</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key} className="border-t border-[#eef5f0]">
              <th scope="row" className="px-4 py-2 text-left font-semibold text-[#112a1d]">{p.longLabel}</th>
              <td className="px-4 py-2 text-right tabular-nums text-[#445c50]">{p.orders}</td>
              <td className="px-4 py-2 text-right font-bold tabular-nums text-[#112a1d]">{formatBDT(p.spent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
