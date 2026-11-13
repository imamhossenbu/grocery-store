'use client';

import { Check, Circle } from 'lucide-react';

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8, required: true },
  { label: 'A letter and a number', test: (p: string) => /[A-Za-z]/.test(p) && /\d/.test(p), required: true },
  { label: 'Upper- and lower-case letters', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p), required: false },
  { label: 'A symbol (e.g. ! @ # %)', test: (p: string) => /[^A-Za-z0-9]/.test(p), required: false },
];

const LEVELS = [
  { label: 'Too short', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-700' },
  { label: 'Good', color: 'bg-[#2ca05d]', text: 'text-[#1a663b]' },
  { label: 'Strong', color: 'bg-[#1a663b]', text: 'text-[#145732]' },
];

/** Live hints under a new-password field. The server enforces the two required rules. */
export function PasswordStrength({ password, id }: { password: string; id?: string }) {
  const passed = RULES.map((r) => r.test(password));
  const meetsRequired = RULES.every((r, i) => !r.required || passed[i]);
  let score = passed.filter(Boolean).length;
  if (password.length >= 12 && meetsRequired) score = Math.min(4, score + 1);
  if (!meetsRequired) score = Math.min(score, 1);
  const level = password ? LEVELS[score] : null;

  return (
    <div id={id} className="mt-2.5 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${level && score >= i ? level.color : 'bg-[#e3eee7]'}`} />
          ))}
        </div>
        <span className={`w-16 text-right text-xs font-bold ${level?.text ?? 'text-[#93a99c]'}`} aria-live="polite">
          {level ? level.label : ''}
        </span>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {RULES.map((r, i) => (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs ${passed[i] ? 'text-[#1a663b]' : 'text-[#6b8577]'}`}>
            {passed[i] ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
            <span>
              {r.label}
              {!r.required && <span className="text-[#93a99c]"> (recommended)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
