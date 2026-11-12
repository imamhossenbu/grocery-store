import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'highlight' | 'forest' | 'outline' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-full cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-emerald-gradient text-white shadow-glow hover:brightness-105 hover:-translate-y-0.5',
    highlight:
      'bg-[#f5b82e] text-[#3a2502] hover:bg-[#e5a91f] shadow-md hover:-translate-y-0.5',
    forest:
      'bg-[#0f2c1d] text-white hover:bg-[#19442e] shadow-md',
    outline:
      'border-2 border-[#cce2d4] bg-white/80 text-[#112a1d] hover:border-[#1a663b] hover:bg-[#f0f7f2]',
    secondary:
      'bg-[#e6f3eb] text-[#14522f] hover:bg-[#d3eadc]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost:
      'bg-transparent text-[#234835] hover:bg-[#e8f3ec]',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-xs px-3.5 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
    icon: 'w-10 h-10 p-0',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

