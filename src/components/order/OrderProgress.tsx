import { Check, CircleX, ClipboardCheck, Home, Package, Truck, Clock } from 'lucide-react';
import type { OrderStatus } from '@/types/store';
import { formatDateTime } from '@/lib/format';

const STEPS: { status: OrderStatus; label: string; hint: string; Icon: typeof Check }[] = [
  { status: 'Pending', label: 'Order placed', hint: 'We received your order', Icon: Clock },
  { status: 'Confirmed', label: 'Confirmed', hint: 'We called and confirmed it', Icon: ClipboardCheck },
  { status: 'Packed', label: 'Packed', hint: 'Fresh items picked and packed', Icon: Package },
  { status: 'Out for delivery', label: 'Out for delivery', hint: 'Our rider is on the way', Icon: Truck },
  { status: 'Delivered', label: 'Delivered', hint: 'Enjoy your groceries!', Icon: Home },
];

interface Props {
  status: OrderStatus;
  history: { status: OrderStatus; at: string }[];
  createdAt: string;
  /** 'vertical' (timeline with times) or 'horizontal' (compact stepper on wide screens). */
  layout?: 'vertical' | 'responsive';
}

/**
 * Visual order status: Pending → Confirmed → Packed → Out for delivery →
 * Delivered, or a cancelled state. Times come from status_history.
 */
export function OrderProgress({ status, history, createdAt, layout = 'vertical' }: Props) {
  const at = new Map<OrderStatus, string>();
  for (const h of history) if (h?.status && h.at) at.set(h.status, h.at);
  if (!at.has('Pending')) at.set('Pending', createdAt);

  if (status === 'Cancelled') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4" role="status">
        <CircleX className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <div>
          <p className="font-bold text-red-800">This order was cancelled</p>
          <p className="text-sm text-red-700">
            {at.get('Cancelled') ? `Cancelled on ${formatDateTime(at.get('Cancelled')!)}. ` : ''}
            If you were charged or have questions, please contact our support team.
          </p>
        </div>
      </div>
    );
  }

  const current = Math.max(0, STEPS.findIndex((s) => s.status === status));
  const horizontal = layout === 'responsive';

  return (
    <ol
      className={horizontal ? 'grid gap-0 md:grid-cols-5 md:gap-2' : 'grid gap-0'}
      aria-label={`Order status: ${STEPS[current].label}`}
    >
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const reached = i <= current;
        const time = at.get(step.status);
        const last = i === STEPS.length - 1;
        return (
          <li
            key={step.status}
            aria-current={active ? 'step' : undefined}
            className={`relative flex gap-3 pb-6 last:pb-0 ${horizontal ? 'md:flex-col md:items-center md:pb-0 md:text-center' : ''}`}
          >
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 bg-[#dcebe2] ${
                  horizontal ? 'md:left-[calc(50%+1.25rem)] md:top-5 md:h-0.5 md:w-[calc(100%-2rem)]' : ''
                }`}
              >
                {done && (
                  <span
                    className={`absolute inset-0 rounded-full bg-[#1a663b] fb-draw-y ${horizontal ? 'md:fb-draw-x' : ''}`}
                    style={{ '--fb-i': i } as React.CSSProperties}
                  />
                )}
              </span>
            )}
            <span
              className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition ${
                done
                  ? 'border-[#1a663b] bg-[#1a663b] text-white'
                  : active
                    ? 'border-[#1a663b] bg-white text-[#1a663b] ring-4 ring-[#1a663b]/15'
                    : 'border-[#dcebe2] bg-white text-[#9ab5a5]'
              }`}
            >
              {done ? <Check className="h-5 w-5" aria-hidden /> : <step.Icon className="h-5 w-5" aria-hidden />}
            </span>
            <div className={`min-w-0 pt-1 ${horizontal ? 'md:pt-0' : ''}`}>
              <p className={`text-sm font-extrabold ${reached ? 'text-[#112a1d]' : 'text-[#8aa595]'}`}>
                {step.label}
                <span className="sr-only">{done ? ' (completed)' : active ? ' (current)' : ' (upcoming)'}</span>
              </p>
              <p className="text-xs text-[#5a7165]">
                {reached && time ? formatDateTime(time) : active || !reached ? step.hint : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
