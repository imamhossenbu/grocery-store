import 'server-only';
import {
  getAllCityCorporations,
  getAllDistricts,
  getAllDivisions,
  getAllThanas,
  getAllUnions,
  getAllUpazilas,
} from 'bangladesh-geo-data';
import {
  ADDRESS_LIMITS,
  TOWN_AREA_ID,
  townArea,
  type AreaPlace,
  type DistrictDetail,
  type DistrictPlace,
  type GeoIndex,
  type Locality,
  type Place,
  type ResolvedAddress,
} from './types';

/**
 * Server-side access to the Bangladesh administrative dataset.
 *
 * Source: `bangladesh-geo-data` (npm, MIT, © Shodorson) — 8 divisions,
 * 64 districts, 495 upazilas, 4,599 unions and 639 thanas, each with English
 * and Bangla names. Its union list derives from the government
 * union-portal data popularised by nuhil/bangladesh-geocode; it adds
 * metropolitan thanas grouped by city corporation (DNCC/DSCC, Chattogram…),
 * which is how city shoppers describe where they live.
 *
 * The package (≈2.7 MB of JSON) is imported only here, never in client code.
 */

// Official English spellings changed in 2018; the dataset still uses some of
// the old ones. Show the new spelling and keep the old one searchable.
const RENAMES: [RegExp, string, string][] = [
  [/\bBogra\b/, 'Bogura', 'bogra'],
  [/\bJessore\b/, 'Jashore', 'jessore'],
  [/\bBarisal\b/, 'Barishal', 'barisal'],
  [/\bComilla\b/, 'Cumilla', 'comilla'],
  [/\bChittagong\b/, 'Chattogram', 'chittagong'],
];

function place(id: string, name: string, nameBn: string, stripEn?: RegExp, stripBn?: RegExp): Place {
  let en = stripEn ? name.replace(stripEn, '').trim() : name;
  const bn = stripBn ? nameBn.replace(stripBn, '').trim() : nameBn;
  const alt: string[] = [];
  for (const [re, modern, old] of RENAMES) {
    if (re.test(en)) {
      en = en.replace(re, modern);
      alt.push(old);
    }
  }
  return alt.length ? { id, en, bn, alt: alt.join(' ') } : { id, en, bn };
}

const byName = (a: Place, b: Place) => a.en.localeCompare(b.en);

interface Tables {
  index: GeoIndex;
  districts: Map<string, DistrictPlace>;
  divisions: Map<string, Place>;
  details: Map<string, DistrictDetail>;
  /** locality id → { districtId, locality } */
  localities: Map<string, { districtId: string; locality: Locality }>;
}

let tables: Tables | null = null;

function build(): Tables {
  const divisions = getAllDivisions().map((d) => place(d.id, d.name, d.nameBn)).sort(byName);
  const districts: DistrictPlace[] = getAllDistricts()
    .map((d) => ({ ...place(d.id, d.name, d.nameBn), divisionId: d.divisionId }))
    .sort(byName);

  const corps = new Map(getAllCityCorporations().map((c) => [c.id, c]));
  const unionsByUpazila = new Map<string, AreaPlace[]>();
  for (const u of getAllUnions()) {
    const a: AreaPlace = { ...place(u.id, u.name, u.nameBn, / Union$/i, / ইউনিয়ন$/), ...(u.postalCode ? { postcode: u.postalCode } : {}) };
    const list = unionsByUpazila.get(u.upazilaId) ?? [];
    list.push(a);
    unionsByUpazila.set(u.upazilaId, list);
  }

  const details = new Map<string, DistrictDetail>();
  const localities = new Map<string, { districtId: string; locality: Locality }>();
  for (const d of districts) details.set(d.id, { districtId: d.id, localities: [], areas: {} });

  // City thanas first (grouped by city corporation), then rural upazilas.
  // Rural / sub-district thanas are skipped: they duplicate upazilas.
  const thanas = getAllThanas()
    .filter((t) => t.type === 'metropolitan' && t.cityCorpId && corps.has(t.cityCorpId))
    .map((t) => {
      const cc = corps.get(t.cityCorpId!)!;
      const loc: Locality = { ...place(t.id, t.name, t.nameBn), kind: 'thana', group: cc.name, groupBn: cc.nameBn };
      return { districtId: t.districtId, loc };
    })
    .sort((a, b) => a.loc.group.localeCompare(b.loc.group) || byName(a.loc, b.loc));
  for (const { districtId, loc } of thanas) {
    details.get(districtId)?.localities.push(loc);
    localities.set(loc.id, { districtId, locality: loc });
  }

  const upazilas = getAllUpazilas()
    .map((u) => ({ districtId: u.districtId, loc: { ...place(u.id, u.name, u.nameBn), kind: 'upazila' as const, group: 'Upazilas', groupBn: 'উপজেলা' } }))
    .sort((a, b) => byName(a.loc, b.loc));
  for (const { districtId, loc } of upazilas) {
    const detail = details.get(districtId);
    if (!detail) continue;
    const hasCity = detail.localities.some((l) => l.kind === 'thana');
    const group = hasCity ? { group: 'Upazilas (outside the city)', groupBn: 'উপজেলা (শহরের বাইরে)' } : {};
    const full: Locality = { ...loc, ...group };
    detail.localities.push(full);
    detail.areas[full.id] = [townArea(full), ...(unionsByUpazila.get(full.id) ?? []).sort(byName)];
    localities.set(full.id, { districtId, locality: full });
  }

  return {
    index: { divisions, districts },
    districts: new Map(districts.map((d) => [d.id, d])),
    divisions: new Map(divisions.map((d) => [d.id, d])),
    details,
    localities,
  };
}

function data(): Tables {
  tables ??= build();
  return tables;
}

export function geoIndex(): GeoIndex {
  return data().index;
}

export function districtDetail(districtId: string): DistrictDetail | null {
  return data().details.get(districtId) ?? null;
}

export function districtIds(): string[] {
  return data().index.districts.map((d) => d.id);
}

export type AddressField = 'division' | 'district' | 'upazila' | 'union';

/**
 * Checks the picker's ids against the dataset (each child must belong to its
 * parent) and returns display names. Free text is only accepted for the
 * neighbourhood under a city thana.
 */
export function resolveAddress(input: { division?: string; district: string; upazila: string; union: string }):
  | { ok: true; value: ResolvedAddress }
  | { ok: false; errors: Partial<Record<AddressField, string>> } {
  const t = data();
  const district = t.districts.get(input.district);
  if (!district) return { ok: false, errors: { district: 'Please choose your district.' } };
  const division = t.divisions.get(district.divisionId);
  if (input.division && input.division !== district.divisionId) {
    return { ok: false, errors: { district: 'That district is not in the selected division. Please choose it again.' } };
  }

  const loc = t.localities.get(input.upazila);
  if (!loc) return { ok: false, errors: { upazila: 'Please choose your upazila or thana.' } };
  if (loc.districtId !== district.id) {
    return { ok: false, errors: { upazila: `That upazila/thana is not in ${district.en}. Please choose it again.` } };
  }

  let union = '';
  if (loc.locality.kind === 'upazila') {
    if (!input.union) return { ok: false, errors: { union: 'Please choose your union or town area.' } };
    const area = t.details.get(district.id)!.areas[loc.locality.id]?.find((a) => a.id === input.union);
    if (!area) return { ok: false, errors: { union: `That area is not in ${loc.locality.en}. Please choose it again.` } };
    union = input.union === TOWN_AREA_ID ? `${loc.locality.en} town` : area.en;
  } else {
    union = input.union.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
    if (union.length > ADDRESS_LIMITS.areaText) {
      return { ok: false, errors: { union: `Keep the area name under ${ADDRESS_LIMITS.areaText} characters.` } };
    }
  }

  return {
    ok: true,
    value: { division: division?.en ?? '', district: district.en, upazila: loc.locality.en, union, kind: loc.locality.kind },
  };
}

/** Divisions + districts, cached across requests (static data). */
export async function cachedGeoIndex(): Promise<GeoIndex> {
  'use cache';
  return geoIndex();
}
