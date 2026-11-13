/**
 * Display helpers for stored addresses (client-safe, no dataset needed).
 * Orders placed before the address picker only have address / area / city.
 */

export interface StoredAddress {
  address: string;
  area?: string;
  city?: string;
  division?: string;
  district?: string;
  upazila?: string;
  union?: string;
  landmark?: string;
  postcode?: string;
}

function uniq(parts: (string | undefined)[]): string[] {
  const out: string[] = [];
  for (const p of parts) {
    const v = p?.trim();
    if (v && !out.some((o) => o.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out;
}

/** "Area, Upazila, District" (or "Area, City" for old orders). */
export function formatLocality(a: StoredAddress): string {
  if (a.district) {
    const district = a.postcode ? `${a.district} ${a.postcode}` : a.district;
    return uniq([a.union, a.upazila, district]).join(', ');
  }
  return uniq([a.area, a.city]).join(', ');
}

/** One line: "House 12, Road 5, Mirzapur, Sherpur, Bogura 5840". */
export function formatAddress(a: StoredAddress): string {
  return uniq([a.address, formatLocality(a)]).join(', ');
}

/** Lines for an address block; landmark on its own line. */
export function addressLines(a: StoredAddress): string[] {
  return uniq([a.address, formatLocality(a), a.landmark ? `Landmark: ${a.landmark}` : undefined]);
}
