'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'lg',
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#071a10]/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizeClass} max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white border border-[#dfece3] shadow-2xl transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#e6f0e9] bg-white/95 backdrop-blur px-6 py-5">
            <div>
              {title && (
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#112a1d]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[#5a7165]">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-full p-2 text-[#5a7165] hover:bg-[#e8f5ee] hover:text-[#112a1d] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {!title && !subtitle && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 z-20 rounded-full bg-white/90 backdrop-blur p-2.5 text-[#112a1d] shadow-md hover:bg-[#e8f5ee] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

