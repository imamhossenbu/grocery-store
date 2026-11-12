'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Clock3, Landmark, Map as MapIcon, MapPin, RefreshCw, Truck, Zap } from 'lucide-react';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { DURATION, EASE } from '@/components/ui/motion';
import { cx } from '@/components/ui/overlay';
import {
  ADDRESS_LIMITS,
  EMPTY_ADDRESS,
  TOWN_AREA_ID,
  deliveryNote,
  type AddressValue,
  type DistrictDetail,
  type GeoIndex,
  type LocalityKind,
} from '@/lib/address/types';
import { AddressCombobox, type ComboOption } from './AddressCombobox';
import { isId, loadDistrict, loadIndex, resolveDistrict, resolveLocality } from './geo-client';

export type AddressErrorField = keyof AddressValue;
export type AddressErrors = Partial<Record<AddressErrorField, string>>;

export interface AddressChangeMeta {
  /** 'thana' (city) needs no union; 'upazila' does. Undefined until chosen. */
  kind?: LocalityKind;
  names: { division: string; district: string; upazila: string; union: string };
  /** true while initial names are still being matched to the dataset. */
  resolving: boolean;
}

export interface AddressPickerProps {
  /**
   * Initial address. Division/district/upazila/union may be dataset ids or
   * stored names ("Bogura", "Sherpur"…); names are matched once lists load.
   * `city` is a fallback for rows saved before the picker existed.
   */
  defaultValue?: Partial<AddressValue> & { city?: string };
  /** Preloaded divisions/districts (saves one request on first paint). */
  index?: GeoIndex;
  errors?: AddressErrors;
  onChange?: (value: AddressValue, meta: AddressChangeMeta) => void;
  /** Called when a field loses focus / a list closes (for touched-state validation). */
  onFieldBlur?: (field: AddressErrorField) => void;
  idPrefix?: string;
  /** Show the optional division pre-filter (default true). */
  showDivision?: boolean;
  disabled?: boolean;
}

export function AddressPicker({
  defaultValue,
  index: preloaded,
  errors = {},
  onChange,
  onFieldBlur,
  idPrefix = 'addr',
  showDivision = true,
  disabled,
}: AddressPickerProps) {
  const [index, setIndex] = useState<GeoIndex | null>(preloaded ?? null);
  const [details, setDetails] = useState<Record<string, DistrictDetail>>({});
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  const [v, setV] = useState<AddressValue>(() => {
    const { city: _city, ...rest } = defaultValue ?? {};
    void _city;
    const init: AddressValue = { ...EMPTY_ADDRESS, ...stripUndefined(rest) };
    if (preloaded && !isId(init.district)) {
      const district = resolveDistrict(preloaded, init.district, defaultValue?.city);
      init.district = district;
      if (!district) init.upazila = init.union = '';
    }
    if (preloaded && init.district) init.division = preloaded.districts.find((d) => d.id === init.district)?.divisionId ?? '';
    if (!isId(init.division)) init.division = '';
    return init;
  });

  // Previous choices per district / upazila, restored when a shopper goes back.
  const memory = useRef(new Map<string, { upazila: string; union: string }>());
  const autoPostcode = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const detail = v.district ? details[v.district] : undefined;
  const locality = detail?.localities.find((l) => l.id === v.upazila);
  const kind = locality?.kind;
  const resolving = (!!v.district && !isId(v.district)) || (!!v.upazila && !isId(v.upazila));

  // ---- data loading -------------------------------------------------------

  useEffect(() => {
    if (index) return;
    let live = true;
    loadIndex()
      .then((idx) => {
        if (!live) return;
        setIndex(idx);
        setLoadError(false);
        setV((cur) => {
          if (!cur.district) return isId(cur.division) || !cur.division ? cur : { ...cur, division: '' };
          if (isId(cur.district)) return cur;
          const district = resolveDistrict(idx, cur.district, defaultValue?.city);
          const division = idx.districts.find((d) => d.id === district)?.divisionId ?? '';
          return district ? { ...cur, district, division } : { ...cur, district: '', upazila: '', union: '' };
        });
      })
      .catch(() => live && setLoadError(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultValue is initial-only
  }, [index, retry]);

  useEffect(() => {
    const id = v.district;
    if (!id || !isId(id) || details[id]) return;
    let live = true;
    loadDistrict(id)
      .then((d) => {
        if (!live) return;
        setDetails((all) => ({ ...all, [id]: d }));
        setLoadError(false);
        setV((cur) => {
          if (cur.district !== id || !cur.upazila || isId(cur.upazila)) return cur;
          return { ...cur, ...resolveLocality(d, cur.upazila, cur.union) };
        });
      })
      .catch(() => live && setLoadError(true));
    return () => {
      live = false;
    };
  }, [v.district, details, retry]);

  // Tell the parent about every change (including name → id resolution).
  const names = useMemo(() => {
    const division = index?.divisions.find((d) => d.id === v.division)?.en ?? '';
    const district = index?.districts.find((d) => d.id === v.district)?.en ?? '';
    const upazila = locality?.en ?? '';
    const union =
      kind === 'thana' ? v.union : v.union === TOWN_AREA_ID ? `${upazila} town` : detail?.areas[v.upazila]?.find((a) => a.id === v.union)?.en ?? '';
    return { division, district, upazila, union };
  }, [index, v, locality, kind, detail]);

  useEffect(() => {
    onChangeRef.current?.(v, { kind, names, resolving });
  }, [v, kind, names, resolving]);

  // ---- options ------------------------------------------------------------

  const divisionOptions: ComboOption[] = useMemo(
    () => (index ? [{ id: '', en: 'All divisions', bn: 'সব বিভাগ' }, ...index.divisions] : []),
    [index]
  );
  const districtOptions: ComboOption[] = useMemo(() => {
    if (!index) return [];
    const divName = new Map(index.divisions.map((d) => [d.id, d.en]));
    return index.districts
      .filter((d) => !v.division || d.divisionId === v.division)
      .map((d) => ({ ...d, meta: v.division ? undefined : `${divName.get(d.divisionId)} division` }));
  }, [index, v.division]);
  const localityOptions: ComboOption[] = detail?.localities ?? [];
  const areaOptions: ComboOption[] = useMemo(
    () =>
      (detail?.areas[v.upazila] ?? []).map((a) => ({
        ...a,
        meta: a.id === TOWN_AREA_ID ? 'Municipality / town (not a union)' : a.postcode ? `Union · post code ${a.postcode}` : 'Union',
      })),
    [detail, v.upazila]
  );

  // ---- updates --------------------------------------------------------------

  const setDivision = (division: string) => {
    setV((cur) => {
      const keep = index?.districts.find((d) => d.id === cur.district)?.divisionId === division;
      return keep ? { ...cur, division } : { ...cur, division, district: '', upazila: '', union: '' };
    });
  };

  const setDistrict = (district: string) => {
    setV((cur) => {
      if (cur.district === district) return cur;
      if (cur.district) memory.current.set(cur.district, { upazila: cur.upazila, union: cur.union });
      const prev = memory.current.get(district) ?? { upazila: '', union: '' };
      const division = index?.districts.find((d) => d.id === district)?.divisionId ?? cur.division;
      return { ...cur, division, district, ...prev };
    });
  };

  const setUpazila = (upazila: string) => {
    setV((cur) => {
      if (cur.upazila === upazila) return cur;
      if (cur.upazila) memory.current.set(cur.upazila, { upazila: cur.upazila, union: cur.union });
      return { ...cur, upazila, union: memory.current.get(upazila)?.union ?? '' };
    });
  };

  const setUnion = (union: string) => {
    const area = detail?.areas[v.upazila]?.find((a) => a.id === union);
    setV((cur) => {
      const next = { ...cur, union };
      // Fill the post code from the union unless the shopper typed their own.
      if (area?.postcode && (!cur.postcode || cur.postcode === autoPostcode.current)) {
        next.postcode = area.postcode;
        autoPostcode.current = area.postcode;
      }
      return next;
    });
  };

  const setText = (field: 'address' | 'landmark' | 'postcode' | 'union', value: string) => setV((cur) => ({ ...cur, [field]: value }));

  const note = deliveryNote(isId(v.district) ? v.district : '');
  const districtLoading = !!v.district && isId(v.district) && !detail && !loadError;
  const ids = {
    division: `${idPrefix}-division`,
    district: `${idPrefix}-district`,
    upazila: `${idPrefix}-upazila`,
    union: `${idPrefix}-union`,
  };

  return (
    <div className="space-y-5">
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>We couldn&apos;t load the address list. Check your connection.</span>
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              setRetry((r) => r + 1);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {showDivision && (
          <Field label={<>Division <Bn>বিভাগ</Bn></>} id={ids.division} optional hint="Narrows the district list." error={errors.division}>
            {(p) => (
              <AddressCombobox
                id={p.id}
                name="division"
                label="Division"
                value={v.division}
                options={divisionOptions}
                onChange={setDivision}
                placeholder="All divisions"
                loading={!index}
                disabled={disabled}
                invalid={p.state === 'error'}
                aria-describedby={p['aria-describedby']}
                icon={<MapIcon />}
                onClose={() => onFieldBlur?.('division')}
              />
            )}
          </Field>
        )}
        <Field label={<>District <Bn>জেলা</Bn></>} id={ids.district} required error={errors.district} className={showDivision ? '' : 'sm:col-span-2'}>
          {(p) => (
            <AddressCombobox
              id={p.id}
              name="district"
              label="District"
              value={v.district}
              options={districtOptions}
              onChange={setDistrict}
              placeholder="Choose your district"
              loading={!index}
              disabled={disabled}
              required
              invalid={p.state === 'error'}
              fallbackLabel={isId(v.district) ? undefined : v.district}
              aria-describedby={p['aria-describedby']}
              icon={<Building2 />}
              onClose={() => onFieldBlur?.('district')}
            />
          )}
        </Field>

        <Field label={<>Upazila / Thana <Bn>উপজেলা / থানা</Bn></>} id={ids.upazila} required error={errors.upazila}>
          {(p) => (
            <AddressCombobox
              id={p.id}
              name="upazila"
              label="Upazila or thana"
              value={v.upazila}
              options={localityOptions}
              onChange={setUpazila}
              placeholder={v.district === 'dis-01' ? 'e.g. Gulshan, Dhanmondi, Savar' : 'Choose upazila / thana'}
              loading={districtLoading}
              disabled={disabled || !v.district}
              disabledText="Choose a district first"
              required
              invalid={p.state === 'error'}
              fallbackLabel={isId(v.upazila) ? undefined : v.upazila}
              aria-describedby={p['aria-describedby']}
              icon={<MapPin />}
              onClose={() => onFieldBlur?.('upazila')}
            />
          )}
        </Field>

        {kind === 'thana' ? (
          <Field
            label={<>Area / neighbourhood <Bn>এলাকা</Bn></>}
            id={ids.union}
            optional
            hint="e.g. Gulshan 2, Block C, Sector 7"
            error={errors.union}
          >
            {(p) => (
              <Input
                {...p}
                name="union"
                value={v.union}
                maxLength={ADDRESS_LIMITS.areaText}
                autoComplete="address-level3"
                placeholder="Your area or block"
                disabled={disabled}
                onChange={(e) => setText('union', e.target.value)}
                onBlur={() => onFieldBlur?.('union')}
              />
            )}
          </Field>
        ) : (
          <Field label={<>Union / Area <Bn>ইউনিয়ন / এলাকা</Bn></>} id={ids.union} required error={errors.union}>
            {(p) => (
              <AddressCombobox
                id={p.id}
                name="union"
                label="Union or area"
                value={v.union}
                options={areaOptions}
                onChange={setUnion}
                placeholder="Choose union or town"
                loading={districtLoading || (!!v.upazila && !detail)}
                disabled={disabled || !v.upazila || !locality}
                disabledText="Choose an upazila first"
                required
                invalid={p.state === 'error'}
                aria-describedby={p['aria-describedby']}
                icon={<Landmark />}
                onClose={() => onFieldBlur?.('union')}
              />
            )}
          </Field>
        )}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {note && (
          <motion.div
            key={note.sameDay ? 'same-day' : 'courier'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            role="status"
            className={cx(
              'flex items-start gap-3 rounded-2xl px-4 py-3',
              note.sameDay ? 'bg-[#e9f6ee] text-[#0f2c1d] ring-1 ring-[#bfe0cb]' : 'bg-[#fff7e3] text-[#3d2c05] ring-1 ring-[#f5d98a]'
            )}
          >
            <span className={cx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl', note.sameDay ? 'bg-[#1a663b] text-white' : 'bg-[#f5b82e] text-[#0f2c1d]')}>
              {note.sameDay ? <Zap className="h-4 w-4" aria-hidden /> : <Truck className="h-4 w-4" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold">{note.title}</span>
              <span className="flex items-center gap-1.5 text-sm text-[#3f5649]">
                <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden /> {note.detail}
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Field label="House / road / flat" required error={errors.address} counter={`${v.address.length}/${ADDRESS_LIMITS.address}`}>
        {(p) => (
          <Textarea
            {...p}
            name="address"
            minRows={2}
            maxRows={5}
            maxLength={ADDRESS_LIMITS.address}
            autoComplete="street-address"
            placeholder="e.g. House 12, Road 5, Flat 3B"
            value={v.address}
            disabled={disabled}
            onChange={(e) => setText('address', e.target.value)}
            onBlur={() => onFieldBlur?.('address')}
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-[1fr_11rem]">
        <Field label="Landmark" optional error={errors.landmark}>
          {(p) => (
            <Input
              {...p}
              name="landmark"
              value={v.landmark}
              maxLength={ADDRESS_LIMITS.landmark}
              placeholder="e.g. Opposite Sherpur Girls' School"
              disabled={disabled}
              onChange={(e) => setText('landmark', e.target.value)}
              onBlur={() => onFieldBlur?.('landmark')}
            />
          )}
        </Field>
        <Field label="Post code" optional error={errors.postcode}>
          {(p) => (
            <Input
              {...p}
              name="postcode"
              value={v.postcode}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={ADDRESS_LIMITS.postcode}
              placeholder="e.g. 5840"
              disabled={disabled}
              onChange={(e) => {
                autoPostcode.current = null;
                setText('postcode', e.target.value.replace(/\D/g, ''));
              }}
              onBlur={() => onFieldBlur?.('postcode')}
            />
          )}
        </Field>
      </div>
    </div>
  );
}

function Bn({ children }: { children: string }) {
  return (
    <span lang="bn" className="ml-1 font-normal text-[#3f5649]">
      {children}
    </span>
  );
}

function stripUndefined<T extends object>(o: T | undefined): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, val]) => val !== undefined && val !== null)) as Partial<T>;
}
