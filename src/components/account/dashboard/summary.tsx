'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Identity + live counts for the dashboard chrome. The chrome (sidebar,
 * drawer, tab bar) is part of the static shell; the per-user summary streams
 * in later through <SummaryBridge> rendered inside a Suspense boundary.
 */
export interface DashboardSummary {
  name: string;
  email: string;
  memberSince: string;
  lastSignInAt: string | null;
  totalOrders: number;
  activeOrders: number;
  awaitingReviews: number;
}

const SummaryContext = createContext<{ summary: DashboardSummary | null; setSummary: (s: DashboardSummary) => void } | null>(null);

export function SummaryProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  return <SummaryContext value={{ summary, setSummary }}>{children}</SummaryContext>;
}

export function useDashboardSummary(): DashboardSummary | null {
  return useContext(SummaryContext)?.summary ?? null;
}

/** Rendered by the server once the summary is known; publishes it to the chrome. */
export function SummaryBridge({ summary }: { summary: DashboardSummary }) {
  const setSummary = useContext(SummaryContext)?.setSummary;
  const key = JSON.stringify(summary);
  useEffect(() => {
    setSummary?.(JSON.parse(key) as DashboardSummary);
  }, [key, setSummary]);
  return null;
}

export { initialsOf } from './initials';
