'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

export function Toaster() {
  const { toasts, dismissToast } = useShop();
  return (
    <div className="fixed bottom-[calc(1rem+var(--bottom-bar))] right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-full sm:max-w-sm pointer-events-none" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.type === 'error' ? XCircle : t.type === 'info' ? Info : CheckCircle2;
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-[#0f2c1d] text-white p-4 shadow-2xl border border-[#1e4d33] animate-slideIn">
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${t.type === 'error' ? 'text-red-400' : 'text-[#f5b82e]'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{t.title}</p>
              {t.description && <p className="text-[13px] text-[#cfe5d8] truncate">{t.description}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-[#789d87] hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
