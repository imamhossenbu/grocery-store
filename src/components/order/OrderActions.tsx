'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt('Copy your order ID:', value);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d6] bg-white px-3 py-1.5 text-xs font-bold text-[#14522f] hover:border-[#1a663b] cursor-pointer print:hidden"
      aria-label={copied ? 'Copied' : `${label} ${value}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#cce2d4] bg-white px-5 py-2.5 text-sm font-semibold text-[#112a1d] hover:border-[#1a663b] hover:bg-[#f0f7f2] cursor-pointer print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden /> Print invoice
    </button>
  );
}

/** Opens the print dialog once the invoice has rendered (used by ?print=1 links). */
export function AutoPrint() {
  useEffect(() => {
    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
