import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-4 ${
        align === 'center' ? 'flex-col items-center text-center' : ''
      }`}
    >
      <div className={align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e5f4eb] border border-[#c5e5d2] px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#165b34]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a663b]" />
          {eyebrow}
        </span>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#112a1d]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base text-[#5a7165] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

