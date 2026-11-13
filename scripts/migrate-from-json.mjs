#!/usr/bin/env node
/**
 * Copy the legacy JSON store into the Postgres tables created by
 * supabase/schema.sql.
 *
 *   npm run db:migrate                 # insert rows that don't exist yet
 *   npm run db:migrate -- --dry-run    # read + transform + report, write nothing
 *   npm run db:migrate -- --overwrite  # also update existing categories/products/coupons
 *
 * Source, in order: the local backup .legacy/database.json (taken before the
 * public file was deleted), then the old public storage URL, then
 * src/lib/seed-data.ts.
 *
 * Idempotent: every write is keyed on the primary key. By default existing rows
 * are left untouched, so re-running never clobbers stock, prices or coupon
 * usage that changed after the first migration. Orders are ALWAYS insert-only
 * (existing orders keep their status history and access token).
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and (except for --dry-run) SUPABASE_SECRET_KEY,
 * read from .env.local by `node --env-file=.env.local`.
 */

import { createClient } from '@supabase/supabase-js';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const OVERWRITE = args.has('--overwrite');
const BATCH = 500;

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';
if (!SUPABASE_URL) fail('NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local.');
if (!DRY_RUN && (!SECRET_KEY || SECRET_KEY.startsWith('your_'))) {
  fail('SUPABASE_SECRET_KEY is not set in .env.local (needed to write). Use --dry-run to only preview.');
}

// ---------------------------------------------------------------------------
// Load source data
// ---------------------------------------------------------------------------

async function loadSource() {
  try {
    const { readFile } = await import('node:fs/promises');
    const local = new URL('../.legacy/database.json', import.meta.url);
    const json = JSON.parse(await readFile(local, 'utf8'));
    if (json && Array.isArray(json.products)) return { data: json, source: '.legacy/database.json (local backup)' };
  } catch {
    // no local backup — try the old public URL next
  }
  const url = `${SUPABASE_URL}/storage/v1/object/public/ecommerce-store/database.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json || !Array.isArray(json.products)) throw new Error('unexpected shape (no products array)');
    return { data: json, source: 'storage: ecommerce-store/database.json' };
  } catch (err) {
    console.warn(`! Could not read the legacy JSON (${err.message}). Falling back to src/lib/seed-data.ts.`);
    const mod = await import(new URL('../src/lib/seed-data.ts', import.meta.url).href);
    return { data: mod.INITIAL_STORE_DATA, source: 'src/lib/seed-data.ts' };
  }
}

// ---------------------------------------------------------------------------
// Transform (legacy camelCase → table columns)
// ---------------------------------------------------------------------------

const str = (v, fallback = '') => (v === null || v === undefined ? fallback : String(v));
const optStr = (v) => (v === null || v === undefined || v === '' ? null : String(v));
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const optNum = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const isoOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function normalizePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  const local = digits.startsWith('880') ? digits.slice(2) : digits;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}

function transform(db, warnings) {
  const categories = (db.categories ?? []).map((c, i) => ({
    id: str(c.id),
    name: str(c.name, str(c.id)),
    blurb: str(c.blurb),
    image: str(c.image),
    sort_order: i,
  }));
  const categoryIds = new Set(categories.map((c) => c.id));

  const products = [];
  for (const p of db.products ?? []) {
    if (!p?.id) {
      warnings.push('Skipped a product with no id.');
      continue;
    }
    if (!categoryIds.has(p.category)) {
      warnings.push(`Product ${p.id}: unknown category "${p.category}" — created a placeholder category.`);
      categoryIds.add(p.category);
      categories.push({ id: str(p.category), name: str(p.category), blurb: '', image: '', sort_order: categories.length });
    }
    products.push({
      id: str(p.id),
      name: str(p.name, str(p.id)),
      category: str(p.category),
      unit: str(p.unit, '1 pc'),
      price: Math.max(0, num(p.price)),
      old_price: optNum(p.oldPrice),
      description: str(p.description),
      image: str(p.image),
      images: Array.isArray(p.images) ? p.images.map(String) : [],
      badge: optStr(p.badge),
      rating: Math.min(5, Math.max(0, Math.round(num(p.rating) * 10) / 10)),
      review_count: Math.max(0, Math.trunc(num(p.reviewCount))),
      sku: str(p.sku),
      stock: Math.max(0, Math.trunc(num(p.stock))),
      sold_count: Math.max(0, Math.trunc(num(p.soldCount))),
      featured: Boolean(p.featured),
      active: p.active !== false,
      origin: optStr(p.origin),
      nutrition: optStr(p.nutrition),
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      ...(isoOrNull(p.createdAt) ? { created_at: isoOrNull(p.createdAt) } : {}),
    });
  }

  const coupons = (db.coupons ?? [])
    .filter((c) => c?.code)
    .map((c) => ({
      code: str(c.code).trim().toUpperCase(),
      label: str(c.label, str(c.code)),
      discount_type: c.discountType === 'percent' ? 'percent' : 'fixed',
      value: Math.max(0, num(c.value)),
      max_discount: optNum(c.maxDiscount),
      min_subtotal: Math.max(0, num(c.minSubtotal)),
      active: c.active !== false,
      expires_at: isoOrNull(c.expiresAt),
    }));

  const orders = [];
  for (const o of db.orders ?? []) {
    if (!o?.id || !o.customer) {
      warnings.push(`Skipped an order without id/customer (${o?.id ?? 'no id'}).`);
      continue;
    }
    const createdAt = isoOrNull(o.createdAt) ?? new Date().toISOString();
    const status = ORDER_STATUSES.includes(o.status) ? o.status : 'Pending';
    if (!ORDER_STATUSES.includes(o.status)) warnings.push(`Order ${o.id}: unknown status "${o.status}" → Pending.`);
    const history = Array.isArray(o.statusHistory) && o.statusHistory.length
      ? o.statusHistory.filter((h) => ORDER_STATUSES.includes(h?.status)).map((h) => ({ status: h.status, at: isoOrNull(h.at) ?? createdAt }))
      : [{ status: 'Pending', at: createdAt }, ...(status !== 'Pending' ? [{ status, at: createdAt }] : [])];

    const items = (Array.isArray(o.items) ? o.items : []).map((i) => ({
      productId: str(i.productId),
      name: str(i.name),
      unit: str(i.unit),
      price: num(i.price),
      qty: Math.max(1, Math.trunc(num(i.qty, 1))),
      image: str(i.image),
    }));
    const subtotal = optNum(o.subtotal) ?? items.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = num(o.discount);
    const deliveryFee = num(o.deliveryFee);
    const c = o.customer;

    orders.push({
      id: str(o.id),
      customer_name: str(c.name, 'Customer'),
      customer_phone: normalizePhone(c.phone) ?? str(c.phone),
      customer_email: optStr(c.email),
      customer_address: str(c.address, '-'),
      customer_area: str(c.area, '-'),
      customer_city: str(c.city, 'Dhaka'),
      delivery_slot: str(c.deliverySlot, '-'),
      notes: optStr(c.notes),
      items,
      subtotal,
      discount,
      coupon_code: optStr(o.couponCode)?.toUpperCase() ?? null,
      delivery_fee: deliveryFee,
      total: optNum(o.total) ?? Math.max(0, subtotal - discount + deliveryFee),
      payment_method: 'cod',
      status,
      status_history: history,
      created_at: createdAt,
      updated_at: history.at(-1)?.at ?? createdAt,
    });
  }

  return { categories, products, coupons, orders };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

async function checkTables(db) {
  const missing = [];
  for (const table of ['categories', 'products', 'coupons', 'orders']) {
    // A GET, not HEAD: PostgREST answers HEAD on a missing table with 204 and no error.
    const { error, status } = await db.from(table).select('*').limit(1);
    if (!error && status !== 404) continue;
    if (!error || error.code === 'PGRST205' || error.code === '42P01') missing.push(table);
    else throw new Error(`${table}: ${error.message}`);
  }
  return missing;
}

async function upsertAll(db, table, rows, key, { insertOnly }) {
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { data, error } = await db
      .from(table)
      .upsert(chunk, { onConflict: key, ignoreDuplicates: insertOnly })
      .select(key);
    if (error) throw new Error(`${table}: ${error.message}`);
    written += data?.length ?? 0;
  }
  return written;
}

async function main() {
  console.log(`FreshBasket data migration${DRY_RUN ? ' (dry run — nothing will be written)' : ''}`);
  const { data, source } = await loadSource();
  console.log(`Source: ${source}`);

  const warnings = [];
  const rows = transform(data, warnings);
  console.log(
    `Read: ${rows.categories.length} categories, ${rows.products.length} products, ` +
      `${rows.coupons.length} coupons, ${rows.orders.length} orders`
  );
  for (const w of warnings) console.warn(`! ${w}`);

  const canConnect = SECRET_KEY && !SECRET_KEY.startsWith('your_');
  const db = canConnect
    ? createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  if (DRY_RUN) {
    const sample = rows.orders[0];
    if (sample) {
      console.log('\nSample order row (customer fields redacted):');
      console.log({
        ...sample,
        customer_name: '[redacted]',
        customer_phone: '[redacted]',
        customer_email: sample.customer_email ? '[redacted]' : null,
        customer_address: '[redacted]',
        notes: sample.notes ? '[redacted]' : null,
        items: `${sample.items.length} item(s)`,
      });
    }
    if (db) {
      const missing = await checkTables(db).catch((e) => {
        console.warn(`! Could not check tables: ${e.message}`);
        return null;
      });
      if (missing?.length) {
        console.log(`\nTables missing: ${missing.join(', ')}. Run supabase/schema.sql in the Supabase SQL editor before a real migration.`);
      } else if (missing) {
        console.log('\nAll tables exist — a real run would write to them.');
      }
    }
    console.log('\n✔ Dry run complete. Re-run without --dry-run to write.');
    return;
  }

  const missing = await checkTables(db);
  if (missing.length) {
    fail(
      `These tables don't exist yet: ${missing.join(', ')}.\n` +
        '  Open Supabase Dashboard → SQL Editor, paste and run supabase/schema.sql, then run `npm run db:migrate` again.'
    );
  }

  const catalogMode = { insertOnly: !OVERWRITE };
  const counts = {
    categories: await upsertAll(db, 'categories', rows.categories, 'id', catalogMode),
    products: await upsertAll(db, 'products', rows.products, 'id', catalogMode),
    coupons: await upsertAll(db, 'coupons', rows.coupons, 'code', catalogMode),
    orders: await upsertAll(db, 'orders', rows.orders, 'id', { insertOnly: true }),
  };

  console.log(`\n✔ Migration complete (${OVERWRITE ? 'insert + update' : 'insert new rows only'}):`);
  for (const [table, n] of Object.entries(counts)) {
    const total = rows[table].length;
    console.log(`  ${table.padEnd(11)} ${String(n).padStart(4)} written, ${String(total - n).padStart(4)} already present`);
  }
  console.log(
    '\nNext: make the storage bucket "ecommerce-store" private (or delete database.json) — it exposes customer data publicly.'
  );
}

main().catch((err) => fail(err?.message ?? String(err)));
