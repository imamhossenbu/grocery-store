import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-[2rem] border-2 border-dashed border-[#cfe3d6] bg-white/80 px-6 py-16 shadow-soft">
      <div className="grid place-items-center w-16 h-16 rounded-2xl bg-[#e8f5ee] text-[#1a663b] mb-5 shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-bold text-[#112a1d]">{title}</h3>
      <p className="mt-2 max-w-md text-sm sm:text-base text-[#5a7165] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

