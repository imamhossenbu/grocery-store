'use client';

import { TOWN_AREA_ID, type DistrictDetail, type GeoIndex, type Place } from '@/lib/address/types';

/**
 * Browser-side loaders for the address lists. Responses are static and
 * browser-cached (see /api/address); this module also memoises them per tab.
 */

const cache = new Map<string, Promise<unknown>>();

function load<T>(url: string): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

export const loadIndex = () => load<GeoIndex>('/api/address');
export const loadDistrict = (id: string) => load<DistrictDetail>(`/api/address/${encodeURIComponent(id)}`);

const ID_RE = /^(div|dis|upa|tha|uni)-\d+$/;
export const isId = (v: string) => ID_RE.test(v) || v === TOWN_AREA_ID;

function sameName(p: Place, name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  return p.id === name || p.en.toLowerCase() === n || p.bn === name.trim() || (p.alt ?? '').split(' ').includes(n);
}

/** Old single-city form areas → thana + neighbourhood. */
const LEGACY_DHAKA_AREAS: Record<string, [string, string]> = {
  Mirpur: ['Mirpur Model', 'Mirpur'],
  Uttara: ['Uttara West', 'Uttara'],
  'Bashundhara R/A': ['Vatara', 'Bashundhara R/A'],
  'Old Dhaka': ['Kotwali', 'Old Dhaka'],
};

export function resolveDistrict(index: GeoIndex, value: string, fallbackCity?: string): string {
  if (!value && !fallbackCity) return '';
  const hit = index.districts.find((d) => sameName(d, value)) ?? (fallbackCity ? index.districts.find((d) => sameName(d, fallbackCity)) : undefined);
  return hit?.id ?? '';
}

export function resolveLocality(detail: DistrictDetail, upazila: string, union: string): { upazila: string; union: string } {
  let up = upazila;
  let un = union;
  const legacy = LEGACY_DHAKA_AREAS[up];
  if (legacy && !un) [up, un] = legacy;
  const loc = detail.localities.find((l) => sameName(l, up));
  if (!loc) return { upazila: '', union: '' };
  if (loc.kind === 'thana') return { upazila: loc.id, union: un };
  const areas = detail.areas[loc.id] ?? [];
  if (!un) return { upazila: loc.id, union: '' };
  if (un === TOWN_AREA_ID || un.toLowerCase() === `${loc.en} town`.toLowerCase()) return { upazila: loc.id, union: TOWN_AREA_ID };
  return { upazila: loc.id, union: areas.find((a) => sameName(a, un))?.id ?? '' };
}
