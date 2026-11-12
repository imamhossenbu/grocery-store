import type { Profile } from '@/types/store';

/** Columns of `profiles` holding the saved address picker parts. */
export const PROFILE_ADDRESS_COLUMNS = 'division, district, upazila, union_name, landmark, postcode';

type Row = Record<string, unknown>;
const opt = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);

/** Optional picker fields of a `profiles` row (undefined when not saved yet). */
export function profileAddressFields(row: Row): Pick<Profile, 'division' | 'district' | 'upazila' | 'union' | 'landmark' | 'postcode'> {
  return {
    division: opt(row.division),
    district: opt(row.district),
    upazila: opt(row.upazila),
    union: opt(row.union_name),
    landmark: opt(row.landmark),
    postcode: opt(row.postcode),
  };
}
