/**
 * Bangladesh address picker: client-safe types and constants.
 *
 * Data comes from the `bangladesh-geo-data` npm package (MIT), which is only
 * ever loaded on the server (see ./geo.ts). The browser receives small
 * per-district payloads from /api/address/[district].
 */

export interface Place {
  /** Stable dataset id, e.g. "dis-41", "upa-220", "tha-0042", "uni-1234". */
  id: string;
  /** English name (modern official spelling, e.g. "Bogura"). */
  en: string;
  /** Bangla name, e.g. "বগুড়া". */
  bn: string;
  /** Extra lowercase search terms (old spellings such as "bogra"). */
  alt?: string;
}

export interface DistrictPlace extends Place {
  divisionId: string;
}

/** Divisions + districts: the always-needed top of the tree (~6 KB). */
export interface GeoIndex {
  divisions: Place[];
  districts: DistrictPlace[];
}

/**
 * The level under a district.
 *  - upazila: a rural sub-district; its areas are unions (+ pourashava/town).
 *  - thana:   a metropolitan police station inside a city corporation
 *             (Gulshan, Dhanmondi…). There are no unions in a city; the
 *             shopper can type a neighbourhood instead.
 */
export type LocalityKind = 'upazila' | 'thana';

export interface Locality extends Place {
  kind: LocalityKind;
  /** Group heading, e.g. "Dhaka North City Corporation" or "Upazilas". */
  group: string;
  groupBn: string;
}

export interface AreaPlace extends Place {
  postcode?: string;
}

export interface DistrictDetail {
  districtId: string;
  localities: Locality[];
  /** Areas (unions) keyed by upazila id. Thanas have none. */
  areas: Record<string, AreaPlace[]>;
}

/** Pseudo-area: the upazila's pourashava / town (not a union). */
export const TOWN_AREA_ID = 'town';
export const townArea = (upazila: Pick<Place, 'en' | 'bn'>): AreaPlace => ({
  id: TOWN_AREA_ID,
  en: `${upazila.en} town / pourashava`,
  bn: `${upazila.bn} পৌরসভা / শহর`,
  alt: 'municipality pourashava paurashava town sadar',
});

/** The ids (and free text) the picker submits with the form. */
export interface AddressValue {
  division: string;
  district: string;
  upazila: string;
  /** union id, TOWN_AREA_ID, or (thanas only) a typed neighbourhood. */
  union: string;
  address: string;
  landmark: string;
  postcode: string;
}

/** Names resolved on the server from the ids above. */
export interface ResolvedAddress {
  division: string;
  district: string;
  upazila: string;
  union: string;
  kind: LocalityKind;
}

export const ADDRESS_LIMITS = {
  address: 200,
  landmark: 80,
  postcode: 4,
  areaText: 60,
} as const;

export const EMPTY_ADDRESS: AddressValue = {
  division: '',
  district: '',
  upazila: '',
  union: '',
  address: '',
  landmark: '',
  postcode: '',
};

/** Dhaka district gets same-day delivery; everywhere else ships by courier. */
export const DHAKA_DISTRICT_ID = 'dis-01';

export function deliveryNote(districtId: string): { title: string; detail: string; sameDay: boolean } | null {
  if (!districtId) return null;
  return districtId === DHAKA_DISTRICT_ID
    ? { title: 'Same-day delivery', detail: 'Our own riders deliver across Dhaka in your chosen slot.', sameDay: true }
    : { title: 'Delivered in 2–4 days by courier', detail: 'We pack your order fresh and hand it to our courier partner.', sameDay: false };
}

/** Lowercased haystack for matching English, Bangla and old spellings. */
export function searchKey(p: Place): string {
  return `${p.en} ${p.bn} ${p.alt ?? ''}`.toLowerCase();
}

export function matches(p: Place, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = searchKey(p);
  return q.split(/\s+/).every((part) => hay.includes(part));
}
