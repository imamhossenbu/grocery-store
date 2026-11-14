#!/usr/bin/env node
/**
 * Seed realistic DEMO data into the FreshBasket database.
 *
 *   npm run db:seed-demo                 # seed (idempotent, safe to re-run)
 *   npm run db:seed-demo -- --dry-run    # build everything, check images, write nothing
 *   npm run db:seed-demo -- --reset      # remove ONLY the demo rows this script created
 *   npm run db:seed-demo -- --refresh    # rebuild demo ACTIVITY up to today (orders, reviews,
 *                                        # messages, subscribers, demo customers); never
 *                                        # writes products, categories or coupons
 *
 * What it does
 *   1. Category tree: keeps the 6 original top-level categories, adds 3 more
 *      (beverages, snacks-bakery, household) and 2–5 subcategories under each,
 *      and moves the 18 original products into the right subcategory.
 *   2. Adds 40 demo products (ids in DEMO_PRODUCTS below).
 *   3. Adds 4 demo coupons (WEEKEND12, BIGBASKET200, PUJA20 [expired], WINTER100).
 *   4. Creates 30 demo customers (auth users with app_metadata.demo = true and
 *      e-mails @demo.freshbasket.test) plus their profiles; 6 live outside Dhaka.
 *   5. Inserts historical orders over the last 90 days up to today (no stock
 *      changes); outside-Dhaka orders use the courier fee and a 2–4 day slot.
 *   6. Inserts ~120 reviews by the demo customers (the DB trigger updates ratings).
 *   7. Adds a few contact messages and newsletter subscribers.
 *   Also deletes the end-to-end TEST order FB-134453 (stock restored first).
 *
 * How demo rows are recognised (used by --reset and by re-runs)
 *   - users:      app_metadata.demo === true AND e-mail ends with @demo.freshbasket.test
 *   - orders:     customer_phone starts with 017000 (reserved demo range) AND the
 *                 e-mail is empty or @demo.freshbasket.test AND id is not a legacy sample
 *   - products / categories / coupons: the fixed ids listed in this file
 *   - reviews:    written by demo users (also removed by the user cascade)
 *   - contact_messages / newsletter_subscribers: @demo.freshbasket.test e-mails
 *
 * Every image URL is checked (HTTP 200 + image/* content type) before writing.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (read from .env.local
 * by `node --env-file=.env.local`). Keys and passwords are never printed.
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const RESET = args.has('--reset');
const REFRESH = args.has('--refresh');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';
if (!SUPABASE_URL) fail('NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local.');
if (!SECRET_KEY || SECRET_KEY.startsWith('your_')) fail('SUPABASE_SECRET_KEY is not set in .env.local.');

const sb = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const DEMO_DOMAIN = 'demo.freshbasket.test';
const DEMO_PHONE_PREFIX = '017000';
const LEGACY_ORDER_IDS = new Set(['FB-240901', 'FB-240902', 'FB-240903', 'FB-240904']);
const TEST_ORDER_ID = 'FB-134453';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

/** Deterministic PRNG so every run generates the same demo data. */
function rngFor(label) {
  let h = 2166136261;
  for (const c of `freshbasket-demo:${label}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    weighted(items, weightOf) {
      const total = items.reduce((s, x) => s + weightOf(x), 0);
      let roll = next() * total;
      for (const x of items) {
        roll -= weightOf(x);
        if (roll < 0) return x;
      }
      return items[items.length - 1];
    },
    hex: (n) => Array.from({ length: n }, () => Math.floor(next() * 16).toString(16)).join(''),
  };
  return r;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const DHAKA_OFFSET_MS = 6 * HOUR;

function dhakaParts(ms) {
  const d = new Date(ms + DHAKA_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), hour: d.getUTCHours(), dow: d.getUTCDay() };
}
/** UTC ms for a Dhaka wall-clock time. */
const dhakaTime = (y, m, d, h, min = 0) => Date.UTC(y, m, d, h, min) - DHAKA_OFFSET_MS;
const DAY_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const iso = (ms) => new Date(ms).toISOString();

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

async function checkImage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      const type = res.headers.get('content-type') ?? '';
      await res.arrayBuffer();
      if (res.ok && type.startsWith('image/')) return null;
      if (res.status === 404) return `HTTP ${res.status}`;
      if (attempt === 2) return `HTTP ${res.status} ${type}`;
    } catch (err) {
      if (attempt === 2) return err.message;
    }
  }
  return 'unknown';
}

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) fail(`${what}: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// 1. Category tree
// ---------------------------------------------------------------------------

/** Category of each original product before this script ran (used by --reset). */
const ORIGINAL_PRODUCT_CATEGORY = {
  'banana-sagor': 'fruits', 'apple-fuji': 'fruits', 'guava-thai': 'fruits', 'mango-himsagar': 'fruits',
  'tomato-organic': 'vegetables', 'potato-bogura': 'vegetables', 'spinach-palong': 'vegetables', 'broccoli-green': 'vegetables',
  'milk-sirajganj': 'dairy', 'mishti-doi-bogura': 'dairy', 'eggs-free-range': 'dairy',
  'honey-sundarbans': 'organic', 'mustard-oil-ghani': 'organic', 'red-rice-organic': 'organic',
  'rice-miniket-premium': 'grocery', 'dal-masoor-deshi': 'grocery',
  'river-hilsha-padma': 'fish-meat', 'beef-bone-in': 'fish-meat',
};
/** Ratings of the original products before demo reviews (restored by --reset). */
const ORIGINAL_RATINGS = {
  'banana-sagor': 4.7, 'apple-fuji': 4.8, 'guava-thai': 4.6, 'mango-himsagar': 4.9, 'tomato-organic': 4.8,
  'potato-bogura': 4.7, 'spinach-palong': 4.9, 'broccoli-green': 4.6, 'milk-sirajganj': 4.9, 'mishti-doi-bogura': 5,
  'eggs-free-range': 4.8, 'honey-sundarbans': 4.9, 'mustard-oil-ghani': 4.8, 'red-rice-organic': 4.7,
  'rice-miniket-premium': 4.8, 'dal-masoor-deshi': 4.7, 'river-hilsha-padma': 4.9, 'beef-bone-in': 4.8,
};

/** New subcategory for each original product. */
const PRODUCT_SUBCATEGORY = {
  'banana-sagor': 'local-fruits', 'guava-thai': 'local-fruits', 'mango-himsagar': 'local-fruits', 'apple-fuji': 'imported-fruits',
  'spinach-palong': 'leafy-greens', 'potato-bogura': 'root-vegetables', 'tomato-organic': 'everyday-vegetables', 'broccoli-green': 'everyday-vegetables',
  'milk-sirajganj': 'milk', 'mishti-doi-bogura': 'doi-yogurt', 'eggs-free-range': 'eggs',
  'honey-sundarbans': 'honey-jaggery', 'mustard-oil-ghani': 'organic-staples', 'red-rice-organic': 'organic-staples',
  'rice-miniket-premium': 'rice', 'dal-masoor-deshi': 'dal-lentils',
  'river-hilsha-padma': 'river-fish', 'beef-bone-in': 'beef-mutton',
};

/**
 * Image fixes for original products (not demo data, kept by --reset):
 * the honey photo returned 404, and the dal photo showed corn instead of lentils.
 */
const PRODUCT_IMAGE_FIXES = {
  'honey-sundarbans': { image: U('1587049352851-8d4e89133924'), images: [U('1587049352851-8d4e89133924'), U('1558642452-9d2a7deb7f62')] },
  'dal-masoor-deshi': { image: U('1770617476260-1addeea7c826'), images: [U('1770617476260-1addeea7c826')] },
};

const ORIGINAL_CATEGORY_IDS = ['fruits', 'vegetables', 'dairy', 'organic', 'grocery', 'fish-meat'];

const CATEGORY_TREE = [
  {
    id: 'fruits', name: 'Fresh Fruits', blurb: 'Seasonal & farm-picked orchard delights', image: U('1610832958506-aa56368176cf'),
    description: 'Deshi fruits straight from orchards in Rajshahi, Narsingdi and Pabna, plus hand-picked imported favourites. Sorted every morning so only firm, ripe fruit reaches your door.',
    children: [
      ['local-fruits', 'Local Fruits', 'Deshi seasonal fruits from Bangladeshi orchards', U('1526318472351-c75fcf070305'),
        'Bananas, guava, papaya, pineapple and green coconut sourced directly from growers across Bangladesh.'],
      ['imported-fruits', 'Imported Fruits', 'Apples, oranges, pomegranates & premium dates', U('1541344999736-83eca272f6fc'),
        'Grade-A imported fruit, cold-chain stored and checked for freshness before packing.'],
    ],
  },
  {
    id: 'vegetables', name: 'Fresh Vegetables', blurb: 'Harvested daily from local co-ops', image: U('1540420773420-3366772f4999'),
    description: 'Shak-sobji collected at dawn from farmer co-ops in Manikganj, Savar, Jashore and Bogura and delivered the same day.',
    children: [
      ['leafy-greens', 'Leafy Greens & Herbs', 'Palong shak, dhonia pata & winter greens', U('1588879460618-9249e7d947d1'),
        'Tender leafy vegetables and fresh herbs, bundled the morning they are cut.'],
      ['root-vegetables', 'Onion, Potato & Roots', 'Peyaj, rosun, ada, alu & gajor', U('1618512496248-a07fe83aa8cb'),
        'Kitchen staples — deshi onion, garlic, ginger, potato and carrot — cleaned and weighed.'],
      ['everyday-vegetables', 'Everyday Vegetables', 'Tomato, cauliflower, chili & more', U('1568584711075-3d021a7c3ca3'),
        'The vegetables that go into every Bangladeshi kitchen, from tomato and broccoli to kacha morich.'],
    ],
  },
  {
    id: 'dairy', name: 'Dairy & Eggs', blurb: 'Pure farm milk, Bogura doi, butter & eggs', image: U('1550583724-b2692b85b150'),
    description: 'Fresh milk from Sirajganj, authentic Bogura doi, butter and farm eggs — kept chilled until delivery.',
    children: [
      ['milk', 'Milk', 'Full-cream farm milk', U('1563636619-e9143da7973b'), 'Pasteurised full-cream milk collected from Shahjadpur dairy farms.'],
      ['doi-yogurt', 'Doi & Yogurt', 'Mishti doi, tok doi & curd', U('1571212515416-fef01fc43637'), 'Traditional clay-pot mishti doi and plain tok doi from Bogura.'],
      ['eggs', 'Eggs', 'Farm & free-range eggs', U('1506976785307-8732e854ad03'), 'Brown and free-range eggs from Gazipur poultry farms, candled for quality.'],
      ['butter-cheese', 'Butter & Cheese', 'Table butter & cheese blocks', U('1589985270826-4b7bb135bc9d'), 'Creamy butter and cheese for breakfast, baking and cooking.'],
    ],
  },
  {
    id: 'organic', name: 'Organic Foods', blurb: '100% chemical-free natural goodness', image: U('1553787434-45e1d245bfbb'),
    description: 'Chemical-free honey, gur, cold-pressed oil and unpolished grains from small producers we know by name.',
    children: [
      ['honey-jaggery', 'Honey & Gur', 'Sundarbans honey & khejur gur', U('1587049352851-8d4e89133924'), 'Raw Sundarbans honey and winter date-palm jaggery from Jashore.'],
      ['organic-staples', 'Organic Staples', 'Ghani oil & unpolished rice', U('1586201375761-83865001e31c'), 'Wood-pressed mustard oil, dheki-chata red rice and other minimally processed staples.'],
    ],
  },
  {
    id: 'grocery', name: 'Daily Grocery', blurb: 'Premium rice, dal, mustard oil & atta', image: U('1586201375761-83865001e31c'),
    description: 'Everything for the monthly bazar — rice, dal, oil, masala, atta and sugar — in sealed, stone-free packs.',
    children: [
      ['rice', 'Rice', 'Miniket, chinigura & more', U('1770617474928-3c7554a51941'), 'Aged, sortex-cleaned rice from Dinajpur and Naogaon mills.'],
      ['dal-lentils', 'Dal & Lentils', 'Masoor, mug & chola', U('1770617476260-1addeea7c826'), 'Deshi and imported pulses, cleaned and packed in 1 kg pouches.'],
      ['oil-ghee', 'Oil & Ghee', 'Soybean oil & pure ghee', U('1552592074-ea7a91b851b3'), 'Fortified cooking oil and pure cow ghee for everyday cooking and polao.'],
      ['spices-masala', 'Spices & Masala', 'Holud, morich & whole spices', U('1596040033229-a9821ebd058d'), 'Single-origin ground spices, freshly milled with no added colour.'],
      ['flour-atta-sugar', 'Atta, Flour & Sugar', 'Atta, chini & baking basics', U('1610725664285-7c57e6eeac3f'), 'Whole-wheat atta and refined sugar for ruti, porota and payesh.'],
    ],
  },
  {
    id: 'fish-meat', name: 'Fish & Meat', blurb: 'River fish & halal farm-fresh cuts', image: U('1534422298391-e4f8c172dddb'),
    description: 'River and sea fish cleaned to order, halal chicken and red meat cut every morning and delivered chilled.',
    children: [
      ['river-fish', 'River Fish & Prawn', 'Ilish, rui & golda chingri', U('1618120995338-f1344edc054a'), 'Freshwater fish from the Padma, Mymensingh farms and Bagerhat gher.'],
      ['sea-fish', 'Sea Fish', 'Bay of Bengal catch', U('1706167754870-54c07a883197'), 'Sea fish landed at Cox’s Bazar and Chattogram, iced on the boat.'],
      ['chicken', 'Chicken', 'Broiler & deshi murgi', U('1587593810167-a84920ea0781'), 'Halal-slaughtered chicken, dressed and cut the same morning.'],
      ['beef-mutton', 'Beef & Mutton', 'Gorur mangsho & khashi', U('1600180786608-28d06391d25c'), 'Halal beef and khashi mutton, curry cut with bone, from Kushtia farms.'],
    ],
  },
  {
    id: 'beverages', name: 'Tea & Beverages', blurb: 'Sylhet tea, juices & drinks', image: U('1621506289937-a8e4df240d0b'),
    description: 'Strong Sylhet cha for every adda and chilled juices for the family.',
    children: [
      ['tea-coffee', 'Tea & Coffee', 'Loose-leaf Sylhet & Srimangal tea', U('1558160074-4d7d8bdf4256'), 'Garden-fresh black tea from Srimangal estates.'],
      ['juices-drinks', 'Juices & Drinks', 'Fruit juices & soft drinks', U('1600271886742-f049cd451bba'), 'Fruit juices with no added sugar and everyday drinks.'],
    ],
  },
  {
    id: 'snacks-bakery', name: 'Snacks & Bakery', blurb: 'Fresh bread, biscuits, chanachur & muri', image: U('1509440159596-0249088772ff'),
    description: 'Daily-baked bread and cookies plus the crunchy snacks every Bangladeshi home keeps for teatime.',
    children: [
      ['bread-bakery', 'Bread & Bakery', 'Daily-baked loaves', U('1549931319-a545dcf3bc73'), 'Soft sandwich bread baked overnight in Tejgaon and delivered the next morning.'],
      ['biscuits-cookies', 'Biscuits & Cookies', 'Cookies for cha time', U('1558961363-fa8fdf82db35'), 'Butter cookies and biscuits that go perfectly with a cup of cha.'],
      ['chanachur-muri', 'Chanachur & Muri', 'Jhal chanachur & deshi muri', U('1788180074988-3332f56d625a'), 'Spicy chanachur and hand-roasted muri — the classic jhalmuri combo.'],
    ],
  },
  {
    id: 'household', name: 'Household Essentials', blurb: 'Cleaning supplies & tissue', image: U('1550963295-019d8a8a61c5'),
    description: 'Dishwashing liquid, tissue and other home essentials, delivered with your groceries.',
    children: [
      ['cleaning-essentials', 'Cleaning Essentials', 'Dishwash & cleaners', U('1590610994353-7b0e7546e681'), 'Kitchen and home cleaning products that are tough on grease and gentle on hands.'],
      ['tissue-paper', 'Tissue & Paper', 'Toilet rolls & tissues', U('1631524254770-03abe3f42a0d'), 'Soft, absorbent tissue rolls in value packs.'],
    ],
  },
];

const NEW_TOP_LEVEL_IDS = ['beverages', 'snacks-bakery', 'household'];

function categoryRows() {
  const rows = [];
  CATEGORY_TREE.forEach((parent, i) => {
    rows.push({ id: parent.id, name: parent.name, blurb: parent.blurb, image: parent.image, description: parent.description, sort_order: i, parent_id: null });
    parent.children.forEach(([id, name, blurb, image, description], j) => {
      rows.push({ id, name, blurb, image, description, sort_order: j, parent_id: parent.id });
    });
  });
  return rows;
}
const SUBCATEGORY_IDS = CATEGORY_TREE.flatMap((p) => p.children.map((c) => c[0]));

// ---------------------------------------------------------------------------
// 2. Demo products (40). rv = product-specific review lines.
// ---------------------------------------------------------------------------

const P = (o) => ({ old_price: null, badge: null, featured: false, images: [o.image], ...o, images: (o.images ?? [o.image]).map(U), image: U(o.image) });

const DEMO_PRODUCTS = [
  // ---- Local fruits
  P({ id: 'papaya-deshi', name: 'Ripe Deshi Papaya (Pepe)', category: 'local-fruits', unit: '1 kg', price: 90, sku: 'FR-005', stock: 85, sold_count: 640,
    origin: 'Ishwardi, Pabna', nutrition: 'Rich in Vitamin A, Vitamin C & Papain enzyme', tags: ['papaya', 'pepe', 'deshi', 'breakfast'],
    description: 'Sweet, deep-orange deshi papaya ripened naturally on the tree in Ishwardi. Soft but not mushy — perfect for breakfast or a quick fruit salad. Each fruit weighs roughly 1–1.5 kg.',
    image: '1526318472351-c75fcf070305', images: ['1526318472351-c75fcf070305', '1517282009859-f000ec3b26fe'],
    rv: ['Papaya was perfectly ripe and very sweet, kono carbide smell nai.', 'Nice orange colour inside, my kids finished it in one sitting.'] }),
  P({ id: 'pineapple-madhupur', name: 'Madhupur Honey Queen Pineapple (Anaras)', category: 'local-fruits', unit: '1 pc (~800 g)', price: 75, old_price: 90, badge: 'Farm Pick', sku: 'FR-006', stock: 60, sold_count: 410,
    origin: 'Madhupur, Tangail', nutrition: 'Vitamin C, Manganese & Bromelain', tags: ['pineapple', 'anaras', 'madhupur'],
    description: 'Honey Queen pineapples from the red-soil gardens of Madhupur — small, fragrant and remarkably sweet. Picked when the eyes turn golden so they are ready to eat on arrival.',
    image: '1550258987-190a2d41a8ba', images: ['1550258987-190a2d41a8ba', '1550828520-4cb496926fc9'],
    rv: ['Madhupur er anaras, very juicy and sweet. Not sour at all.', 'Good size pineapple for the price, smelled amazing.'] }),
  P({ id: 'green-coconut-dab', name: 'Fresh Green Coconut (Dab)', category: 'local-fruits', unit: '1 pc (large)', price: 110, badge: 'Best Seller', featured: true, sku: 'FR-007', stock: 45, sold_count: 520,
    origin: 'Bagerhat', nutrition: 'Natural Electrolytes, Potassium & Magnesium', tags: ['dab', 'coconut', 'hydration'],
    description: 'Tender green dab from Bagerhat with plenty of sweet coconut water and soft malai inside. Delivered whole — ask the rider and we will cut the top for you.',
    image: '1617611140379-0e0ec17cc45f', images: ['1617611140379-0e0ec17cc45f', '1623329786985-cd1ca52f8c70', '1518484157348-2cd88dc70d1f'],
    rv: ['Lots of water in each dab, and the rider cut it open for us. Great for my father during fever.', 'Sweet dab er pani, much better than roadside ones.'] }),
  // ---- Imported fruits
  P({ id: 'mandarin-orange', name: 'Sweet Imported Mandarin (Komola)', category: 'imported-fruits', unit: '1 kg', price: 290, old_price: 330, badge: 'Seasonal', featured: true, sku: 'FR-008', stock: 70, sold_count: 380,
    origin: 'Imported (China)', nutrition: 'High Vitamin C, Folate & Flavonoids', tags: ['orange', 'komola', 'winter', 'imported'],
    description: 'Easy-peel winter komola with juicy, seedless segments. Sweet with a light tang — a winter favourite for lunch boxes. Around 7–9 pieces per kg.',
    image: '1547514701-42782101795e', images: ['1547514701-42782101795e', '1582979512210-99b6a53386f9'],
    rv: ['Easy to peel and juicy, winter er perfect komola.', 'Sweet and fresh, about 8 pieces in a kg.'] }),
  P({ id: 'pomegranate-anar', name: 'Imported Red Pomegranate (Anar)', category: 'imported-fruits', unit: '1 kg', price: 480, old_price: 560, sku: 'FR-009', stock: 16, sold_count: 210,
    origin: 'Imported (India)', nutrition: 'Punicalagin Antioxidants, Vitamin K & Fibre', tags: ['pomegranate', 'anar', 'imported'],
    description: 'Large, heavy pomegranates with deep-red, juicy arils. Hand-checked for cracks and soft spots before packing. Usually 3–4 pieces per kg.',
    image: '1541344999736-83eca272f6fc', images: ['1541344999736-83eca272f6fc', '1615485925600-97237c4fc1ec'],
    rv: ['Dark red seeds inside, very juicy. Worth the price.', 'All three anar were fresh, none were dry inside.'] }),
  P({ id: 'dates-mabroom', name: 'Premium Mabroom Dates (Khejur)', category: 'imported-fruits', unit: '500 g pack', price: 650, badge: 'New', sku: 'FR-010', stock: 55, sold_count: 190,
    origin: 'Imported (Saudi Arabia)', nutrition: 'Natural Sugars, Iron, Potassium & Fibre', tags: ['dates', 'khejur', 'mabroom', 'iftar'],
    description: 'Long, chewy Mabroom dates with a rich caramel taste and thin skin. Packed in a resealable food-grade pouch. Great with milk at breakfast or as a healthy snack.',
    image: '1784043437426-3261c7f2c3de', images: ['1784043437426-3261c7f2c3de', '1774857247287-d68599847107', '1629738601425-494c3d6ba3e2'],
    rv: ['Soft and chewy khejur, not too sweet. Packaging was sealed properly.', 'Good quality dates, my mother loved them.'] }),
  // ---- Leafy greens
  P({ id: 'coriander-dhonia', name: 'Fresh Coriander Leaves (Dhonia Pata)', category: 'leafy-greens', unit: '100 g bundle', price: 20, badge: 'Farm Fresh', sku: 'VG-005', stock: 140, sold_count: 1250,
    origin: 'Jashore', nutrition: 'Vitamin K, Vitamin A & Antioxidants', tags: ['coriander', 'dhonia', 'herbs'],
    description: 'Fragrant winter dhonia pata with tender stems, washed of soil and bundled the morning it is cut. A fistful lifts any dal, bhorta or curry.',
    image: '1588879460618-9249e7d947d1',
    rv: ['Dhonia pata was super fresh and fragrant, lasted 4 days in the fridge.', 'Very aromatic, no yellow leaves at all.'] }),
  P({ id: 'cabbage-badhakopi', name: 'Winter Green Cabbage (Badhakopi)', category: 'leafy-greens', unit: '1 pc (~1 kg)', price: 45, badge: 'Seasonal', sku: 'VG-006', stock: 90, sold_count: 430,
    origin: 'Munshiganj', nutrition: 'Vitamin C, Vitamin K & Dietary Fibre', tags: ['cabbage', 'badhakopi', 'winter'],
    description: 'Tight, crunchy winter cabbage from Munshiganj with crisp green leaves. Ideal for badhakopi bhaji, salads and noodles.',
    image: '1594282486552-05b4d80fbb9f',
    rv: ['Firm and heavy cabbage, crunchy leaves. Made bhaji the same night.', 'Fresh badhakopi, good size for the price.'] }),
  // ---- Root vegetables
  P({ id: 'onion-deshi', name: 'Deshi Peyaj (Local Red Onion)', category: 'root-vegetables', unit: '1 kg', price: 95, old_price: 110, badge: 'Best Seller', featured: true, sku: 'VG-007', stock: 200, sold_count: 2350,
    origin: 'Faridpur', nutrition: 'Quercetin, Vitamin C & Prebiotic Fibre', tags: ['onion', 'peyaj', 'deshi', 'staple'],
    description: 'Small, pungent deshi peyaj from Faridpur — the onion that gives Bangladeshi bhuna its flavour. Dry-skinned, sorted and free of sprouting or rot.',
    image: '1618512496248-a07fe83aa8cb', images: ['1618512496248-a07fe83aa8cb', '1508747703725-719777637510'],
    rv: ['Real deshi peyaj, strong flavour. No rotten ones in the bag.', 'Dry and well sorted onions, cheaper than the shop near my house.'] }),
  P({ id: 'garlic-deshi', name: 'Deshi Rosun (Local Garlic)', category: 'root-vegetables', unit: '500 g', price: 120, sku: 'VG-008', stock: 110, sold_count: 980,
    origin: 'Natore', nutrition: 'Allicin, Manganese & Vitamin B6', tags: ['garlic', 'rosun', 'deshi'],
    description: 'Small-clove deshi garlic from Natore with an intense aroma — a little goes a long way. Dry, firm bulbs with no mould.',
    image: '1540148426945-6cf22a6b2383',
    rv: ['Small cloves but very strong smell, deshi rosun er moto.', 'Bulbs were dry and firm, good quality.'] }),
  P({ id: 'ginger-ada', name: 'Fresh Ada (Ginger)', category: 'root-vegetables', unit: '500 g', price: 115, sku: 'VG-009', stock: 95, sold_count: 870,
    origin: 'Bandarban Hills', nutrition: 'Gingerol, Potassium & Digestive Aid', tags: ['ginger', 'ada', 'hill-grown'],
    description: 'Juicy, fibrous hill ginger from Bandarban with a sharp, warm bite. Perfect for ada-cha, marinades and curry paste.',
    image: '1758055660285-d32b7b3b1e77', images: ['1758055660285-d32b7b3b1e77', '1635843104103-ddd88e1c5141', '1573414405995-2012861b74e0'],
    rv: ['Pahari ada, very strong. Great for ada cha in this weather.', 'Fresh and juicy ginger, not dried out.'] }),
  P({ id: 'carrot-gajor', name: 'Winter Carrot (Gajor)', category: 'root-vegetables', unit: '1 kg', price: 70, badge: 'Seasonal', sku: 'VG-010', stock: 120, sold_count: 560,
    origin: 'Jashore', nutrition: 'Beta-Carotene, Vitamin K & Fibre', tags: ['carrot', 'gajor', 'winter'],
    description: 'Sweet, crunchy winter carrots from Jashore, washed and sorted. Great for gajorer halua, salads and fried rice.',
    image: '1598170845058-32b9d6a5da37', images: ['1598170845058-32b9d6a5da37', '1447175008436-054170c2e979'],
    rv: ['Sweet carrots, made gajorer halua and it came out great.', 'Fresh and crunchy, washed properly.'] }),
  // ---- Everyday vegetables
  P({ id: 'cauliflower-phulkopi', name: 'Fresh Cauliflower (Phulkopi)', category: 'everyday-vegetables', unit: '1 pc (~700 g)', price: 50, badge: 'Seasonal', sku: 'VG-011', stock: 0, sold_count: 470,
    origin: 'Manikganj', nutrition: 'Vitamin C, Vitamin K & Choline', tags: ['cauliflower', 'phulkopi', 'winter'],
    description: 'Compact, snow-white winter phulkopi from Manikganj with fresh green leaves. Ideal for phulkopir dalna, roast or bhaji. Restocked every morning in season.',
    image: '1568584711075-3d021a7c3ca3',
    rv: ['White and compact phulkopi, no worms inside.', 'Fresh winter cauliflower, made dalna with potato. Delicious.'] }),
  P({ id: 'green-chili', name: 'Green Chili (Kacha Morich)', category: 'everyday-vegetables', unit: '250 g', price: 40, sku: 'VG-012', stock: 150, sold_count: 1420,
    origin: 'Bogura', nutrition: 'Capsaicin, Vitamin C & Vitamin B6', tags: ['chili', 'kacha-morich', 'spicy'],
    description: 'Glossy, hot kacha morich from Bogura, picked green and firm. The essential partner for bhorta, dal and every curry.',
    image: '1524593410820-38510f580a77', images: ['1524593410820-38510f580a77', '1693664132235-1b7050b45da5'],
    rv: ['Very jhal kacha morich, exactly what I wanted.', 'Fresh and green, stayed good for a week in the fridge.'] }),
  // ---- Dairy
  P({ id: 'butter-salted', name: 'Salted Table Butter', category: 'butter-cheese', unit: '200 g pack', price: 320, old_price: 350, sku: 'DR-004', stock: 40, sold_count: 260,
    origin: 'Sirajganj Dairy Co-op', nutrition: '80% Milk Fat, Vitamin A & Vitamin D', tags: ['butter', 'breakfast', 'dairy'],
    description: 'Creamy salted butter churned from fresh Sirajganj cream. Spreads smoothly on warm toast and adds richness to polao and baking. Keep refrigerated.',
    image: '1589985270826-4b7bb135bc9d',
    rv: ['Creamy butter with nice salt balance, arrived well chilled.', 'Tastes like proper dairy butter, good on paratha.'] }),
  P({ id: 'tok-doi', name: 'Plain Tok Doi (Sour Yogurt)', category: 'doi-yogurt', unit: '500 g cup', price: 140, sku: 'DR-005', stock: 35, sold_count: 340,
    origin: 'Sherpur, Bogura', nutrition: 'Live Cultures, Protein & Calcium', tags: ['doi', 'yogurt', 'tok-doi', 'probiotic'],
    description: 'Thick, naturally set sour doi with no sugar added — great for raita, borhani, marinades or eating plain after lunch.',
    image: '1571212515416-fef01fc43637',
    rv: ['Thick tok doi, perfect sourness for borhani.', 'Fresh and creamy, used it for chicken marinade.'] }),
  P({ id: 'eggs-layer-brown', name: 'Farm Fresh Brown Eggs (Lal Dim)', category: 'eggs', unit: '1 dozen', price: 145, badge: 'Best Seller', sku: 'DR-006', stock: 180, sold_count: 1980,
    origin: 'Gazipur', nutrition: '6g Protein per Egg, Vitamin B12 & Selenium', tags: ['eggs', 'dim', 'protein', 'breakfast'],
    description: 'Fresh brown layer eggs from Gazipur farms, collected daily and candled for cracks. Packed in a sturdy tray so they reach you whole.',
    image: '1506976785307-8732e854ad03', images: ['1506976785307-8732e854ad03', '1587486913049-53fc88980cfc'],
    rv: ['Not a single broken egg, tray packaging was solid.', 'Fresh dim, yolks were bright and firm.'] }),
  // ---- Grocery
  P({ id: 'rice-chinigura', name: 'Aromatic Chinigura Rice', category: 'rice', unit: '1 kg pack', price: 160, old_price: 175, badge: 'Premium', featured: true, sku: 'GR-003', stock: 130, sold_count: 1120,
    origin: 'Dinajpur', nutrition: 'Complex Carbohydrates, Low Fat & Gluten-Free', tags: ['rice', 'chinigura', 'polao', 'aromatic'],
    description: 'Small-grain, fragrant chinigura rice from Dinajpur — the classic choice for polao, khichuri and payesh. Aged for aroma and sortex-cleaned so there are no stones.',
    image: '1770617474928-3c7554a51941', images: ['1770617474928-3c7554a51941', '1516684732162-798a0062be99'],
    rv: ['Polao came out super fragrant, real chinigura smell.', 'Clean rice, no stones or broken grains. Used it for payesh.'] }),
  P({ id: 'mug-dal', name: 'Mug Dal (Split Yellow Moong)', category: 'dal-lentils', unit: '1 kg pack', price: 165, sku: 'GR-004', stock: 100, sold_count: 640,
    origin: 'Patuakhali', nutrition: '24g Protein per 100g, Folate & Iron', tags: ['dal', 'mug-dal', 'moong', 'protein'],
    description: 'Golden split mug dal from the southern char lands — lightly roasted, it cooks quickly into a nutty, comforting dal. Cleaned and stone-free.',
    image: '1702041357314-db5826c96f04',
    rv: ['Mug dal cooked fast and tasted nutty after roasting.', 'Clean dal, no stones. Good for khichuri.'] }),
  P({ id: 'chickpeas-kabuli', name: 'Kabuli Chola (Chickpeas)', category: 'dal-lentils', unit: '1 kg pack', price: 135, old_price: 150, sku: 'GR-005', stock: 85, sold_count: 520,
    origin: 'Imported (Australia)', nutrition: '19g Protein per 100g, Fibre & Manganese', tags: ['chickpeas', 'chola', 'iftar'],
    description: 'Large, even-sized kabuli chola that soak and cook evenly. Make chola bhuna for iftar, chana masala or hummus.',
    image: '1644432757699-bb5a01e8fb0e', images: ['1644432757699-bb5a01e8fb0e', '1788629071924-37c53b52eeb7'],
    rv: ['Big and even chola, softened nicely after overnight soaking.', 'Good quality chickpeas, made chola bhuna for guests.'] }),
  P({ id: 'soybean-oil-5l', name: 'Fortified Soybean Oil', category: 'oil-ghee', unit: '5 litre jar', price: 935, old_price: 960, badge: 'Daily Essential', featured: true, sku: 'GR-006', stock: 75, sold_count: 890,
    origin: 'Refined in Narayanganj', nutrition: 'Vitamin A Fortified, Omega-6 & Zero Trans Fat', tags: ['oil', 'soybean', 'cooking', 'staple'],
    description: 'Refined, Vitamin-A fortified soybean oil for everyday cooking and frying. Light taste, high smoke point, in a sealed 5-litre jar with a carry handle.',
    image: '1552592074-ea7a91b851b3', images: ['1552592074-ea7a91b851b3', '1720468750623-39e9a09f5067'],
    rv: ['Price was lower than the shop and they carried the 5 litre jar up to 6th floor.', 'Seal was intact, same oil we always use.'] }),
  P({ id: 'ghee-cow', name: 'Pure Cow Ghee (Gawa Ghee)', category: 'oil-ghee', unit: '400 g jar', price: 780, badge: 'Premium', sku: 'GR-007', stock: 28, sold_count: 240,
    origin: 'Baghabari, Sirajganj', nutrition: 'Butyric Acid, Vitamins A, D, E & K', tags: ['ghee', 'gawa-ghee', 'polao'],
    description: 'Slow-cooked pure cow ghee from Baghabari milk, golden and grainy with a rich aroma. A spoonful makes polao, khichuri and ruti special.',
    image: '1601232265936-6da280cff563', images: ['1601232265936-6da280cff563', '1573812461383-e5f8b759d12e'],
    rv: ['Danadar ghee with real aroma, not adulterated like many market ones.', 'Excellent ghee, a spoon in khichuri is enough.'] }),
  P({ id: 'turmeric-powder', name: 'Pure Turmeric Powder (Holud Gura)', category: 'spices-masala', unit: '200 g pack', price: 95, sku: 'GR-008', stock: 120, sold_count: 760,
    origin: 'Rangamati Hill Tracts', nutrition: 'Curcumin, Iron & Manganese', tags: ['turmeric', 'holud', 'spice'],
    description: 'Bright, earthy holud gura ground from sun-dried hill turmeric with no added colour. Gives curries a natural golden colour.',
    image: '1615485500834-bc10199bc727',
    rv: ['Natural holud colour, no artificial yellow on the hands.', 'Good aroma, pure turmeric.'] }),
  P({ id: 'chili-powder', name: 'Red Chili Powder (Morich Gura)', category: 'spices-masala', unit: '200 g pack', price: 110, sku: 'GR-009', stock: 110, sold_count: 690,
    origin: 'Bogura', nutrition: 'Capsaicin, Vitamin A & Vitamin E', tags: ['chili', 'morich-gura', 'spice'],
    description: 'Deep-red morich gura milled from sun-dried Bogura chillies. Medium-hot with great colour — perfect for bhuna and bhorta.',
    image: '1625921133217-8d978f7872b8', images: ['1625921133217-8d978f7872b8', '1577563717655-919fc57789b4'],
    rv: ['Good colour and medium jhal, curry looked beautiful.', 'Fresh morich gura, packet was sealed well.'] }),
  P({ id: 'atta-whole-wheat', name: 'Whole Wheat Atta (Lal Atta)', category: 'flour-atta-sugar', unit: '2 kg pack', price: 130, sku: 'GR-010', stock: 140, sold_count: 830,
    origin: 'Thakurgaon', nutrition: 'Whole-Grain Fibre, Protein & B Vitamins', tags: ['atta', 'flour', 'ruti'],
    description: 'Chakki-ground whole wheat atta from Thakurgaon wheat. Makes soft ruti and porota that stay soft for hours.',
    image: '1610725664285-7c57e6eeac3f', images: ['1610725664285-7c57e6eeac3f', '1574323347407-f5e1ad6d020b'],
    rv: ['Ruti stays soft even in the tiffin box.', 'Fresh atta, no smell, good texture.'] }),
  P({ id: 'sugar-white', name: 'Refined White Sugar (Chini)', category: 'flour-atta-sugar', unit: '1 kg pack', price: 125, sku: 'GR-011', stock: 190, sold_count: 1350,
    origin: 'Refined in Chattogram', nutrition: '99.9% Sucrose', tags: ['sugar', 'chini', 'staple'],
    description: 'Clean, free-flowing white sugar in a sealed 1 kg pack. For cha, payesh, desserts and everyday cooking.',
    image: '1634612831148-03a8550e1d52', images: ['1634612831148-03a8550e1d52', '1769259397222-33e425659c43'],
    rv: ['Clean dry sugar, packet sealed. Same as market price.', 'Good chini, no lumps.'] }),
  // ---- Fish & meat
  P({ id: 'rui-fish', name: 'Fresh Rui Fish (Whole, 2–2.5 kg)', category: 'river-fish', unit: '1 kg', price: 380, old_price: 420, featured: true, sku: 'FM-003', stock: 38, sold_count: 420,
    origin: 'Mymensingh', nutrition: '17g Protein per 100g, Omega-3 & Vitamin D', tags: ['fish', 'rui', 'river-fish'],
    description: 'Fresh rui from Mymensingh ponds, delivered on ice. Choose cutting style at checkout notes — whole, curry pieces or with the matha separate. Price is per kg of the whole fish.',
    image: '1618120995338-f1344edc054a', images: ['1618120995338-f1344edc054a', '1657786040116-da389b5d083e'],
    rv: ['Rui was very fresh, gills were red. They cut it exactly as I asked.', 'Big rui, pieces were clean and scaled properly.'] }),
  P({ id: 'golda-chingri', name: 'Golda Chingri (Giant River Prawn)', category: 'river-fish', unit: '500 g pack', price: 650, old_price: 720, badge: 'River Catch', sku: 'FM-004', stock: 9, sold_count: 260,
    origin: 'Bagerhat', nutrition: '20g Protein per 100g, Selenium & Vitamin B12', tags: ['prawn', 'golda', 'chingri', 'malaikari'],
    description: 'Large golda chingri from Bagerhat gher, 8–10 pieces per 500 g, with heads on. The star of chingri malaikari. Delivered on ice.',
    image: '1565680018434-b513d5e5fd47', images: ['1565680018434-b513d5e5fd47', '1559737558-2f5a35f4523b'],
    rv: ['Golda chingri were big and fresh, malaikari was a hit.', 'Fresh prawns with firm meat, came on ice.'] }),
  P({ id: 'datina-sea-fish', name: 'Sea Datina Fish (Whole)', category: 'sea-fish', unit: '1 kg', price: 520, badge: 'New', sku: 'FM-005', stock: 22, sold_count: 140,
    origin: "Cox's Bazar", nutrition: 'Lean Protein, Omega-3 & Iodine', tags: ['sea-fish', 'datina', 'bay-of-bengal'],
    description: "Firm, white-fleshed datina landed at Cox's Bazar and iced on the boat. Delicious fried whole, grilled or in a light jhol. 2–3 fish per kg.",
    image: '1706167754870-54c07a883197', images: ['1706167754870-54c07a883197', '1706167754880-434ef5038408'],
    rv: ['First time trying datina, firm flesh and not fishy at all. Fried it whole.', 'Fresh sea fish, eyes were clear.'] }),
  P({ id: 'broiler-chicken', name: 'Broiler Chicken (Whole, Skinless)', category: 'chicken', unit: '1 kg (dressed)', price: 310, badge: 'Best Seller', featured: true, sku: 'FM-006', stock: 70, sold_count: 1560,
    origin: 'Gazipur Farms', nutrition: '27g Protein per 100g & Low Fat', tags: ['chicken', 'broiler', 'murgi', 'halal'],
    description: 'Halal-slaughtered broiler, skinned and dressed the same morning. Cut into curry pieces on request and delivered chilled in a sealed pack.',
    image: '1587593810167-a84920ea0781', images: ['1587593810167-a84920ea0781', '1604503468506-a8da13d82791'],
    rv: ['Clean cut chicken, no smell, packed in a sealed bag with ice.', 'Fresh murgi, pieces were cut evenly for curry.'] }),
  P({ id: 'mutton-khashi', name: 'Deshi Khashi Mutton (Curry Cut)', category: 'beef-mutton', unit: '1 kg pack', price: 1150, old_price: 1250, sku: 'FM-007', stock: 18, sold_count: 310,
    origin: 'Kushtia', nutrition: '25g Protein per 100g, Iron & Zinc', tags: ['mutton', 'khashi', 'halal', 'meat'],
    description: 'Tender deshi khashi mutton, curry cut with bone and very little fat. Halal, cut the same morning and delivered chilled.',
    image: '1600180786608-28d06391d25c', images: ['1600180786608-28d06391d25c', '1602470521006-aaea8b2fcc36'],
    rv: ['Real khashi meat, tender and cooked quickly. Very little fat.', 'Fresh mutton, the kacchi came out great.'] }),
  // ---- Organic
  P({ id: 'khejur-gur', name: 'Khejur Gur (Date-Palm Jaggery)', category: 'honey-jaggery', unit: '500 g', price: 320, badge: 'Seasonal', featured: true, sku: 'OR-004', stock: 12, sold_count: 150,
    origin: 'Khajura, Jashore', nutrition: 'Iron, Magnesium & Natural Minerals', tags: ['gur', 'khejur-gur', 'winter', 'organic'],
    description: 'The first patali gur of the winter from Jashore gachhis — no sugar or hydros added. Melts into pitha and payesh with that unmistakable winter aroma. Limited daily batches.',
    image: '1788238025855-55581a2ed354',
    rv: ['Asol khejur gur, smell e bujha jay. Made bhapa pitha.', 'No sugar mixed, the patali was soft and aromatic.'] }),
  // ---- Beverages
  P({ id: 'tea-sylhet', name: 'Sylhet Premium Black Tea (Loose Leaf)', category: 'tea-coffee', unit: '400 g pack', price: 260, old_price: 290, badge: 'Premium', featured: true, sku: 'BV-001', stock: 95, sold_count: 720,
    origin: 'Srimangal, Moulvibazar', nutrition: 'Antioxidant Theaflavins, Zero Calories', tags: ['tea', 'cha', 'sylhet', 'srimangal'],
    description: 'Strong CTC-blend black tea from Srimangal gardens — brews a deep, malty cup that holds up to milk and sugar. Packed in a foil-lined pouch to keep the aroma.',
    image: '1606163017137-888c0177b3dd', images: ['1606163017137-888c0177b3dd', '1558160074-4d7d8bdf4256', '1563822249366-3efb23b8e0c9'],
    rv: ['Kora liquor, perfect for dudh cha. Our whole office switched to this.', 'Strong colour and nice aroma, good value.'] }),
  P({ id: 'orange-juice', name: '100% Orange Juice (No Added Sugar)', category: 'juices-drinks', unit: '1 litre', price: 380, badge: 'New', sku: 'BV-002', stock: 40, sold_count: 180,
    origin: 'Imported (Egypt)', nutrition: 'Vitamin C, Potassium & Folate', tags: ['juice', 'orange', 'no-sugar'],
    description: 'Pure orange juice with no added sugar, colour or preservatives. Serve chilled at breakfast or iftar.',
    image: '1600271886742-f049cd451bba', images: ['1600271886742-f049cd451bba', '1621506289937-a8e4df240d0b'],
    rv: ['Tastes like real orange, not sugary.', 'Kids liked it, arrived cold.'] }),
  // ---- Snacks & bakery
  P({ id: 'bread-sandwich', name: 'Fresh Sandwich Bread (Large)', category: 'bread-bakery', unit: '1 loaf (700 g)', price: 110, sku: 'SB-001', stock: 60, sold_count: 980,
    origin: 'Baked in Tejgaon, Dhaka', nutrition: 'Energy-Rich Carbohydrates & Protein', tags: ['bread', 'pauruti', 'breakfast'],
    description: 'Soft, evenly sliced sandwich bread baked overnight and delivered the next morning. Best within three days.',
    image: '1549931319-a545dcf3bc73', images: ['1549931319-a545dcf3bc73', '1509440159596-0249088772ff'],
    rv: ['Soft bread with that morning-baked smell.', 'Fresh pauruti, expiry date was 4 days later.'] }),
  P({ id: 'cookies-chocochip', name: 'Butter Choco-Chip Cookies', category: 'biscuits-cookies', unit: '300 g box', price: 280, old_price: 320, sku: 'SB-002', stock: 45, sold_count: 260,
    origin: 'Baked in Dhaka', nutrition: 'Butter, Dark Chocolate & Wheat Flour', tags: ['cookies', 'biscuit', 'tea-time'],
    description: 'Crunchy-edged, chewy-centred butter cookies loaded with dark chocolate chips. Perfect with an evening cup of cha.',
    image: '1558961363-fa8fdf82db35', images: ['1558961363-fa8fdf82db35', '1499636136210-6f4ee915583e'],
    rv: ['Cookies were crunchy and buttery, box finished in two days.', 'Lots of chocolate chips, not too sweet.'] }),
  P({ id: 'chanachur-jhal', name: 'Jhal Chanachur (Spicy Bombay Mix)', category: 'chanachur-muri', unit: '350 g pack', price: 90, sku: 'SB-003', stock: 130, sold_count: 1100,
    origin: 'Narayanganj', nutrition: 'Lentils, Peanuts & Gram Flour', tags: ['chanachur', 'snack', 'jhalmuri'],
    description: 'Crunchy, spicy chanachur with peanuts, sev and fried dal — mix it with muri, onion and mustard oil for the perfect jhalmuri.',
    image: '1788180074988-3332f56d625a', images: ['1788180074988-3332f56d625a', '1788180074861-40b65b841057'],
    rv: ['Perfect jhal, jhalmuri adda complete.', 'Crunchy and fresh, lots of peanuts.'] }),
  P({ id: 'muri-deshi', name: 'Hand-Roasted Deshi Muri (Puffed Rice)', category: 'chanachur-muri', unit: '500 g pack', price: 70, sku: 'SB-004', stock: 90, sold_count: 640,
    origin: 'Barishal', nutrition: 'Light Carbohydrates, Low Fat', tags: ['muri', 'puffed-rice', 'iftar'],
    description: 'Crisp deshi muri roasted in sand the traditional way, with no urea or whitener. Light, crunchy and tasty.',
    image: '1781630437399-90046c920772',
    rv: ['Crispy deshi muri, not the chemical white kind.', 'Stayed crunchy for days after opening.'] }),
  // ---- Household
  P({ id: 'dishwash-lemon', name: 'Lemon Dishwashing Liquid', category: 'cleaning-essentials', unit: '500 ml bottle', price: 125, sku: 'HH-001', stock: 80, sold_count: 410,
    origin: 'Made in Bangladesh', nutrition: null, tags: ['dishwash', 'cleaning', 'kitchen'],
    description: 'Concentrated lemon dishwashing liquid that cuts through oil and masala stains. A few drops are enough for a full sink; gentle on hands.',
    image: '1590610994353-7b0e7546e681', images: ['1590610994353-7b0e7546e681', '1773526535649-e89045ea57c0'],
    rv: ['Cuts oil easily, a little goes a long way.', 'Nice lemon smell, does not dry the hands.'] }),
  P({ id: 'tissue-rolls-4', name: 'Soft Toilet Tissue Rolls (4-Pack)', category: 'tissue-paper', unit: '4 rolls', price: 160, sku: 'HH-002', stock: 100, sold_count: 520,
    origin: 'Made in Bangladesh', nutrition: null, tags: ['tissue', 'toilet-roll', 'household'],
    description: 'Soft, two-ply tissue rolls that are strong yet gentle. Value pack of four.',
    image: '1631524254770-03abe3f42a0d', images: ['1631524254770-03abe3f42a0d', '1584556812945-a6830379555b'],
    rv: ['Soft and does not tear easily. Good value pack.', 'Delivered with my groceries, saves a trip to the shop.'] }),
];

/** Review lines for the original 18 products. */
const ORIGINAL_RV = {
  'banana-sagor': ['Sagor kola were perfectly ripe, not overripe.', 'Sweet bananas, the dozen lasted us three days.'],
  'apple-fuji': ['Crisp and juicy apples, not mealy at all.', 'Fresh Fuji apples, nice red colour.'],
  'guava-thai': ['Crunchy peyara, kids love it with salt and chili.', 'Big guavas and very fresh.'],
  'mango-himsagar': ['Himsagar er taste, no carbide smell.', 'Sweet and fiberless mangoes.'],
  'tomato-organic': ['Red and firm tomatoes, great for salad.', 'Tomatoes were fresh, none squashed.'],
  'potato-bogura': ['Good quality Bogura alu, cooks soft.', 'Clean potatoes, no green ones.'],
  'spinach-palong': ['Fresh palong shak, washed easily and cooked well.', 'Tender leaves, no yellow ones.'],
  'broccoli-green': ['Tight green florets, very fresh.', 'Good broccoli, stir-fried it with garlic.'],
  'milk-sirajganj': ['Thick milk with real cream on top after boiling.', 'Fresh doodh every week, never got sour.'],
  'mishti-doi-bogura': ['Asol Bogura doi er taste! Perfectly set.', 'Not too sweet, creamy, the clay pot was intact.'],
  'eggs-free-range': ['Bright orange yolks, much better than regular eggs.', 'All eggs intact, good packaging.'],
  'honey-sundarbans': ['Pure Sundarbans modhu, thick and aromatic.', 'Real khalisha flower honey, we have been taking it with warm water every morning.'],
  'mustard-oil-ghani': ['Strong jhaj, perfect for bhorta and achar.', 'Real ghani oil smell, takes me back to village.'],
  'red-rice-organic': ['Lal chal is filling and tasty, good for my diabetic father.', 'Unpolished rice, cooks well with a bit more water.'],
  'rice-miniket-premium': ['Clean rice, cooks fluffy and separate.', 'Good quality chal, no stones.'],
  'dal-masoor-deshi': ['Deshi masoor, dal is thick and tasty.', 'Clean dal, cooks quickly.'],
  'river-hilsha-padma': ['Padma ilish er taste ase! Shorshe ilish was amazing.', 'Fresh ilish with shining scales, worth the price.'],
  'beef-bone-in': ['Tender beef, very little fat and cut nicely.', 'Fresh mangsho, cooked a great bhuna.'],
};

// Popularity weights for picking items into orders (staples sell more).
const ORIGINAL_POPULARITY = {
  'banana-sagor': 7, 'apple-fuji': 5, 'guava-thai': 4, 'mango-himsagar': 3, 'tomato-organic': 7, 'potato-bogura': 10,
  'spinach-palong': 5, 'broccoli-green': 3, 'milk-sirajganj': 9, 'mishti-doi-bogura': 4, 'eggs-free-range': 5,
  'honey-sundarbans': 3, 'mustard-oil-ghani': 4, 'red-rice-organic': 2, 'rice-miniket-premium': 8, 'dal-masoor-deshi': 7,
  'river-hilsha-padma': 3, 'beef-bone-in': 4,
};

// ---------------------------------------------------------------------------
// 3. Coupons
// ---------------------------------------------------------------------------

const ORIGINAL_COUPON_CODES = ['WELCOME50', 'FRESH10', 'ORGANIC15'];
const DEMO_COUPONS = [
  { code: 'WEEKEND12', label: 'Weekend bazar: 12% off up to ৳150', discount_type: 'percent', value: 12, max_discount: 150, min_subtotal: 800,
    active: true, starts_at: '2026-10-01T00:00:00+06:00', expires_at: '2026-12-31T23:59:59+06:00', usage_limit: null, base_used: 0 },
  { code: 'BIGBASKET200', label: '৳200 off on big baskets over ৳3,000', discount_type: 'fixed', value: 200, max_discount: null, min_subtotal: 3000,
    active: true, starts_at: null, expires_at: null, usage_limit: null, base_used: 0 },
  { code: 'PUJA20', label: 'Durga Puja special: 20% off up to ৳250', discount_type: 'percent', value: 20, max_discount: 250, min_subtotal: 1000,
    active: true, starts_at: '2026-10-10T00:00:00+06:00', expires_at: '2026-10-24T23:59:59+06:00', usage_limit: 300, base_used: 120 },
  { code: 'WINTER100', label: 'Winter launch: ৳100 off over ৳1,200 (limited)', discount_type: 'fixed', value: 100, max_discount: null, min_subtotal: 1200,
    active: true, starts_at: '2026-11-01T00:00:00+06:00', expires_at: '2026-12-15T23:59:59+06:00', usage_limit: 150, base_used: 141 },
];
const COUPON_RULES = {
  WELCOME50: { discount_type: 'fixed', value: 50, max_discount: null, min_subtotal: 500 },
  FRESH10: { discount_type: 'percent', value: 10, max_discount: 200, min_subtotal: 300 },
  ORGANIC15: { discount_type: 'percent', value: 15, max_discount: 300, min_subtotal: 1000 },
  ...Object.fromEntries(DEMO_COUPONS.map((c) => [c.code, c])),
};

function couponDiscount(code, subtotal) {
  const c = COUPON_RULES[code];
  if (!c || subtotal < c.min_subtotal) return 0;
  if (c.discount_type === 'fixed') return Math.min(c.value, subtotal);
  let d = Math.round((subtotal * c.value) / 100);
  if (c.max_discount != null) d = Math.min(d, c.max_discount);
  return d;
}
const deliveryFee = (subtotal) => (subtotal >= 1000 ? 0 : 60);
/** Same as the default store_settings / delivery_fee_for() fallback. */
const OUTSIDE_DHAKA_FEE = 130;

// ---------------------------------------------------------------------------
// 4. Demo customers
// ---------------------------------------------------------------------------

const DEMO_USERS = [
  { email: 'nusrat.jahan', name: 'Nusrat Jahan', area: 'Uttara', address: 'House 23, Road 7, Sector 4', loyalty: 5 },
  { email: 'tanvir.ahmed', name: 'Tanvir Ahmed', area: 'Dhanmondi', address: 'Flat 5B, House 41, Road 8/A', loyalty: 4 },
  { email: 'farhana.rahman', name: 'Farhana Rahman', area: 'Gulshan', address: 'Apt 3C, House 18, Road 104, Gulshan-2', loyalty: 5 },
  { email: 'rakib.hasan', name: 'Rakib Hasan', area: 'Mirpur', address: 'House 6, Road 3, Block D, Mirpur-10', loyalty: 3 },
  { email: 'sadia.islam', name: 'Sadia Islam', area: 'Bashundhara R/A', address: 'House 112, Road 5, Block C', loyalty: 4 },
  { email: 'mehedi.hasan', name: 'Mehedi Hasan', area: 'Mohammadpur', address: '14/2 Tajmahal Road, Flat 4A', loyalty: 2 },
  { email: 'tasnim.chowdhury', name: 'Tasnim Chowdhury', area: 'Banani', address: 'House 57, Road 11, Block E', loyalty: 3 },
  { email: 'arif.hossain', name: 'Arif Hossain', area: 'Badda', address: 'House 9, Lane 4, Merul Badda', loyalty: 2 },
  { email: 'sharmin.akter', name: 'Sharmin Akter', area: 'Khilgaon', address: '382 Khilgaon Taltola, Flat 2D', loyalty: 3 },
  { email: 'imran.kabir', name: 'Imran Kabir', area: 'Motijheel', address: 'Flat 7A, 21 Purana Paltan Lane', loyalty: 2 },
  { email: 'jannatul.ferdous', name: 'Jannatul Ferdous', area: 'Old Dhaka', address: '45 Lalbagh Road, 2nd Floor', loyalty: 2 },
  { email: 'shahriar.alam', name: 'Shahriar Alam', area: 'Uttara', address: 'House 30, Road 14, Sector 11', loyalty: 3 },
  { email: 'mahbub.alam', name: 'Mahbub Alam', area: 'Mirpur', address: 'House 44, Road 6, Pallabi', loyalty: 3 },
  { email: 'rifat.chowdhury', name: 'Rifat Chowdhury', area: 'Bashundhara R/A', address: 'House 210, Road 11, Block D', loyalty: 4 },
  { email: 'sumaiya.akter', name: 'Sumaiya Akter', area: 'Dhanmondi', address: 'Flat 3A, House 15, Road 27 (Old)', loyalty: 4 },
  { email: 'nafis.iqbal', name: 'Nafis Iqbal', area: 'Gulshan', address: 'House 9, Road 63, Gulshan-2', loyalty: 3 },
  { email: 'tahmina.begum', name: 'Tahmina Begum', area: 'Mohammadpur', address: '7/9 Humayun Road, Block B', loyalty: 3 },
  { email: 'ashraful.haque', name: 'Ashraful Haque', area: 'Uttara', address: 'House 12, Road 5, Sector 7', loyalty: 2 },
  { email: 'mitu.rahman', name: 'Mitu Rahman', area: 'Other Area in Dhaka', address: 'House 22, Road 8, Banasree Block C', loyalty: 2 },
  { email: 'sabbir.hossain', name: 'Sabbir Hossain', area: 'Badda', address: 'House 4, Road 10, Middle Badda', loyalty: 2 },
  { email: 'lamia.islam', name: 'Lamia Islam', area: 'Old Dhaka', address: '18 Rankin Street, Wari', loyalty: 3 },
  { email: 'fahim.ahmed', name: 'Fahim Ahmed', area: 'Mirpur', address: 'House 61, Road 4, Mirpur DOHS', loyalty: 2 },
  { email: 'priya.das', name: 'Priya Das', area: 'Mohammadpur', address: 'Flat 2C, 3/14 Lalmatia Block D', loyalty: 3 },
  { email: 'naimul.karim', name: 'Naimul Karim', area: 'Banani', address: 'House 33, Road 2, Block C', loyalty: 1 },
  { email: 'anika.tabassum', name: 'Anika Tabassum', area: 'Panchlaish', district: 'Chattogram', division: 'Chattogram', address: 'House 5, Road 2, Panchlaish R/A', loyalty: 2 },
  { email: 'ruhul.amin', name: 'Ruhul Amin', area: 'Sylhet Sadar', district: 'Sylhet', division: 'Sylhet', address: 'Zindabazar, Rongmohol Tower 4th Floor', loyalty: 2 },
  { email: 'shirin.sultana', name: 'Shirin Sultana', area: 'Boalia', district: 'Rajshahi', division: 'Rajshahi', address: 'Holding 112, Shaheb Bazar', loyalty: 1 },
  { email: 'moinul.islam', name: 'Moinul Islam', area: 'Sonadanga', district: 'Khulna', division: 'Khulna', address: 'House 17, Road 3, Sonadanga R/A', loyalty: 1 },
  { email: 'kaniz.fatema', name: 'Kaniz Fatema', area: 'Bogura Sadar', district: 'Bogura', division: 'Rajshahi', address: 'Jaleshwaritola, House 8', loyalty: 2 },
  { email: 'jubayer.hasan', name: 'Jubayer Hasan', area: 'Gazipur Sadar', district: 'Gazipur', division: 'Dhaka', address: 'House 21, Road 6, Board Bazar', loyalty: 2 },
].map((u, i) => ({ ...u, email: `${u.email}@${DEMO_DOMAIN}`, phone: `${DEMO_PHONE_PREFIX}${String(101 + i * 7).padStart(5, '0')}` }));

const GUESTS = [
  ['Ayesha Siddiqua', 'Dhanmondi', 'House 3, Road 12/A'],
  ['Kamrul Islam', 'Mirpur', 'Section 2, Road 5, House 14'],
  ['Rumana Haque', 'Gulshan', 'House 7, Road 36, Gulshan-1'],
  ['Shafiqul Alam', 'Mohammadpur', 'Block B, House 22, Iqbal Road'],
  ['Fatema Begum', 'Old Dhaka', '12 Armanitola Lane'],
  ['Habibur Rahman', 'Khilgaon', 'House 201, Block C, Khilgaon'],
  ['Nadia Sultana', 'Banani', 'Flat 6A, House 12, Road 17'],
  ['Saiful Islam', 'Badda', 'House 16, Road 2, Uttar Badda'],
  ['Mahmuda Khatun', 'Uttara', 'House 8, Road 2, Sector 6'],
  ['Zahid Hasan', 'Bashundhara R/A', 'House 48, Road 9, Block F'],
  ['Rezaul Karim', 'Motijheel', '66 Arambagh, 3rd Floor'],
  ['Laila Arjumand', 'Other Area in Dhaka', 'House 19, Road 4, Aftabnagar'],
  ['Asif Iqbal', 'Mirpur', 'House 31, Road 11, Mirpur DOHS'],
  ['Rokeya Parvin', 'Dhanmondi', 'Flat B2, 27 Satmasjid Road'],
  ['Touhid Rahman', 'Other Area in Dhaka', 'House 5, Road 3, Banasree Block D'],
  ['Nasrin Akhter', 'Kotwali', 'Jamal Khan Road, House 11', 'Chattogram', 'Chattogram'],
  ['Biplob Saha', 'Narayanganj Sadar', '23 BB Road, Chashara', 'Narayanganj', 'Dhaka'],
  ['Farzana Yasmin', 'Cumilla Sadar', 'House 7, Kandirpar', 'Cumilla', 'Chattogram'],
  ['Mizanur Rahman', 'Mymensingh Sadar', 'House 14, Ganginarpar', 'Mymensingh', 'Mymensingh'],
].map(([name, area, address, district, division], i) => ({
  name, area, address, district: district ?? 'Dhaka', division: division ?? 'Dhaka',
  phone: `${DEMO_PHONE_PREFIX}${String(30001 + i * 13).padStart(5, '0')}`,
  email: i % 3 === 2 ? null : `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${DEMO_DOMAIN}`,
}));

const ORDER_NOTES = [
  'Please call before coming, the doorbell does not work.',
  'Gate er guard er kache rekhe diben.',
  'Leave with the security guard if I am not home.',
  'Please cut the fish into curry pieces.',
  'Need the delivery before 10 AM if possible.',
  'Lift is out of order, 4th floor. Sorry!',
  'Please bring change for 1000 taka.',
  'Ring twice, baby is sleeping.',
];

// ---------------------------------------------------------------------------
// Data building
// ---------------------------------------------------------------------------

const SLOTS = [
  { id: 'Morning (8:00 AM – 11:00 AM)', start: 8, cutoff: 9 },
  { id: 'Afternoon (1:00 PM – 4:00 PM)', start: 13, cutoff: 14 },
  { id: 'Evening (5:00 PM – 8:00 PM)', start: 17, cutoff: 18 },
];
// Dhaka-hour order weights (morning bazar and after-office peaks).
const HOUR_WEIGHTS = { 7: 2, 8: 4, 9: 6, 10: 7, 11: 6, 12: 4, 13: 3, 14: 3, 15: 3, 16: 4, 17: 4, 18: 5, 19: 6, 20: 7, 21: 7, 22: 5, 23: 2 };
const CARD_TYPES = [
  ['BKASH-BKash', 'bKash Limited', 45], ['NAGAD-Nagad', 'Nagad', 20], ['VISA-Dutch Bangla', 'DUTCH-BANGLA BANK LIMITED', 14],
  ['MASTER-BRAC bank', 'BRAC BANK LIMITED', 10], ['AMEX-City Bank', 'THE CITY BANK LIMITED', 5], ['DBBLMOBILEB-Dbbl Mobile Banking', 'DUTCH-BANGLA BANK LIMITED', 6],
];

function buildOrders({ catalog, users, now, takenIds }) {
  const r = rngFor('orders');
  const nowParts = dhakaParts(now);
  const todayStart = dhakaTime(nowParts.y, nowParts.m, nowParts.day, 0);
  const pool = catalog.filter((p) => p.active !== false);
  const weightOf = (p) => p.popularity ?? 3;
  const orders = [];
  const usedIds = new Set(takenIds);

  for (let d = 89; d >= 0; d--) {
    const dayStart = todayStart - d * DAY;
    const { dow } = dhakaParts(dayStart + 12 * HOUR);
    const weekend = dow === 5 || dow === 6; // Fri / Sat in Bangladesh
    const lambda = 0.9 + 1.1 * (1 - d / 89) + (weekend ? 0.6 : 0) + (d === 0 ? 4.5 : d === 1 ? 2.5 : 0);
    let n = Math.floor(lambda) + (r.chance(lambda - Math.floor(lambda)) ? 1 : 0);
    if (r.chance(0.15)) n += 1;
    for (let k = 0; k < n; k++) {
      const hour = Number(r.weighted(Object.keys(HOUR_WEIGHTS), (h) => HOUR_WEIGHTS[h]));
      const createdAt = dayStart + hour * HOUR + r.int(0, 59) * MIN + r.int(0, 59) * 1000;
      if (createdAt > now - 20 * MIN) continue;
      orders.push(makeOrder(r, createdAt, weekend));
    }
  }
  return orders.sort((a, b) => a._created - b._created);

  function makeOrder(r, createdAt, weekend) {
    let id;
    do id = `FB-${String(r.int(100000, 999999))}`; while (usedIds.has(id));
    usedIds.add(id);

    // Customer
    const linked = r.chance(0.6);
    let customer;
    if (linked) {
      const u = r.weighted(users, (x) => x.loyalty);
      customer = { user_id: u.id, name: u.name, phone: u.phone, email: u.email, address: u.address, area: u.area, district: u.district ?? 'Dhaka', division: u.division ?? 'Dhaka' };
    } else {
      const g = r.pick(GUESTS);
      customer = { user_id: null, ...g };
    }

    // Items
    const count = Number(r.weighted(['1', '2', '3', '4', '5', '6', '7'], (c) => [12, 20, 22, 18, 13, 9, 6][Number(c) - 1]));
    const chosen = new Map();
    while (chosen.size < count) {
      const p = r.weighted(pool, weightOf);
      if (chosen.has(p.id)) continue;
      const qty = p.price >= 600 ? 1 : Number(r.weighted(['1', '2', '3'], (q) => ({ 1: 62, 2: 30, 3: 8 })[q]));
      chosen.set(p.id, { productId: p.id, name: p.name, unit: p.unit, price: Number(p.price), qty, image: p.image });
    }
    const items = [...chosen.values()];
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

    // Coupon (only codes valid on that date and for this subtotal)
    let coupon = null;
    if (r.chance(0.28)) {
      const valid = Object.keys(COUPON_RULES).filter((code) => {
        const c = COUPON_RULES[code];
        if (c.starts_at && Date.parse(c.starts_at) > createdAt) return false;
        if (c.expires_at && Date.parse(c.expires_at) < createdAt) return false;
        if (code === 'WEEKEND12' && !weekend) return false;
        return subtotal >= c.min_subtotal;
      });
      if (valid.length) coupon = r.pick(valid);
    }
    const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
    const outsideDhaka = customer.district !== 'Dhaka';
    const fee = outsideDhaka ? OUTSIDE_DHAKA_FEE : deliveryFee(subtotal);
    const total = Math.max(0, subtotal - discount + fee);

    // Delivery slot (same rules as the checkout)
    const cp = dhakaParts(createdAt);
    const todaySlots = SLOTS.filter((s) => cp.hour < s.cutoff);
    const deliverToday = todaySlots.length > 0 && r.chance(0.45);
    const slot = deliverToday ? r.pick(todaySlots) : r.pick(SLOTS);
    const dayOffset = deliverToday ? 0 : 1;
    const label = DAY_LABEL.format(new Date(Date.UTC(cp.y, cp.m, cp.day + dayOffset)));
    // Outside Dhaka goes by courier: no slot, delivered 2–4 days later.
    const deliverySlot = outsideDhaka ? 'Courier delivery · 2–4 days' : `${slot.id} · ${deliverToday ? 'Today' : 'Tomorrow'}, ${label}`;
    const slotStart = outsideDhaka ? dhakaTime(cp.y, cp.m, cp.day + r.int(2, 3), 10) : dhakaTime(cp.y, cp.m, cp.day + dayOffset, slot.start);

    // Payment + timeline
    const online = r.chance(0.35);
    const cancelled = r.chance(0.07);
    const history = [{ status: 'Pending', at: createdAt }];
    let payment = { method: online ? 'sslcommerz' : 'cod', status: online ? 'pending' : 'unpaid', tran_id: null, val_id: null, details: null, paid_at: null };
    if (online) payment.tran_id = `${id.replace('-', '')}-${r.hex(12)}`;
    const onlineFails = online && cancelled && r.chance(0.6);

    if (onlineFails) {
      const failAt = createdAt + r.int(3, 40) * MIN;
      const kind = r.chance(0.5) ? 'failed' : 'cancelled';
      payment.status = kind;
      payment.details = { failure: kind, reason: kind === 'failed' ? 'Transaction declined by the issuer' : r.pick(['Cancelled by customer', 'expired']), at: iso(failAt) };
      history.push({ status: 'Cancelled', at: failAt });
    } else {
      let t = createdAt;
      if (online) {
        t = createdAt + r.int(2, 7) * MIN;
        const [cardType, issuer] = r.weighted(CARD_TYPES, (c) => c[2]);
        const pp = dhakaParts(t);
        const stamp = `${String(pp.y).slice(2)}${String(pp.m + 1).padStart(2, '0')}${String(pp.day).padStart(2, '0')}${String(pp.hour).padStart(2, '0')}${r.int(1000, 9999)}`;
        payment = {
          ...payment, status: 'paid', paid_at: t, val_id: `${stamp}${r.hex(10).toUpperCase()}`,
          details: { status: 'VALID', amount: total.toFixed(2), currency: 'BDT', card_type: cardType, card_issuer: issuer, bank_tran_id: `${stamp}${r.int(100000, 999999)}`, tran_date: iso(t), risk_level: '0' },
        };
        history.push({ status: 'Confirmed', at: t });
      } else {
        t = createdAt + r.int(6, 55) * MIN;
        history.push({ status: 'Confirmed', at: t });
      }
      if (cancelled) {
        // Customer or staff cancelled before dispatch.
        history.push({ status: 'Cancelled', at: t + r.int(15, 150) * MIN });
        if (online) payment = { ...payment, status: 'refunded', details: { ...payment.details, refunded: true, refund_reason: 'Order cancelled by customer before dispatch' } };
      } else {
        const outAt = Math.max(t + 40 * MIN, slotStart - r.int(10, 40) * MIN);
        const packedAt = Math.max(t + 15 * MIN, outAt - r.int(40, 150) * MIN);
        const deliveredAt = Math.max(outAt + 25 * MIN, slotStart + r.int(35, 170) * MIN);
        history.push({ status: 'Packed', at: Math.min(packedAt, outAt - 10 * MIN) }, { status: 'Out for delivery', at: outAt }, { status: 'Delivered', at: deliveredAt });
        if (!online) payment._paidOnDelivery = deliveredAt;
      }
    }
    // Orders from the last two days are still moving through the pipeline:
    // stop the timeline at a stage that fits the order's age.
    const age = now - createdAt;
    if (age < 2 * DAY && history[history.length - 1].status === 'Delivered') {
      const stages = ['Pending', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'];
      const weights = age < 4 * HOUR ? [55, 35, 10, 0, 0] : age < DAY ? [15, 30, 30, 20, 5] : [0, 5, 10, 15, 70];
      let stage = stages.indexOf(r.weighted(stages, (s) => weights[stages.indexOf(s)]));
      if (online) stage = Math.max(stage, 1); // paid online orders are confirmed automatically
      history.length = stage + 1;
      const last = history[history.length - 1].at;
      if (last > now - 5 * MIN) {
        // squeeze the kept events between creation and a few minutes ago
        const span = Math.max(MIN, now - 5 * MIN - createdAt);
        history.forEach((h, i) => { if (i > 0) h.at = createdAt + Math.round((span * i) / history.length); });
        if (online && payment.paid_at) payment.paid_at = history[1].at;
      }
      delete payment._paidOnDelivery;
      if (stage === 4 && !online) payment._paidOnDelivery = history[4].at;
    }
    const visible = history.filter((h) => h.at <= now).sort((a, b) => a.at - b.at);
    const status = visible[visible.length - 1].status;
    if (payment._paidOnDelivery && status === 'Delivered') {
      payment.status = 'paid';
      payment.paid_at = payment._paidOnDelivery;
    }
    // An online payment that has not been confirmed yet would still be 'pending'.
    if (online && payment.paid_at && payment.paid_at > now) {
      payment.status = 'pending';
      payment.paid_at = null;
      payment.val_id = null;
      payment.details = null;
    }

    return {
      _created: createdAt,
      id,
      user_id: customer.user_id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      customer_address: customer.address,
      customer_area: customer.area,
      customer_city: customer.district,
      customer_division: customer.division,
      customer_district: customer.district,
      customer_upazila: customer.area,
      delivery_slot: deliverySlot,
      notes: r.chance(0.18) ? r.pick(ORDER_NOTES) : null,
      items,
      subtotal,
      discount,
      coupon_code: discount > 0 ? coupon : null,
      delivery_fee: fee,
      total,
      payment_method: payment.method,
      payment_status: payment.status,
      payment_tran_id: payment.tran_id,
      payment_val_id: payment.val_id,
      payment_details: payment.details,
      paid_at: payment.paid_at ? iso(payment.paid_at) : null,
      status,
      status_history: visible.map((h) => ({ status: h.status, at: iso(h.at) })),
      created_at: iso(createdAt),
      updated_at: iso(visible[visible.length - 1].at),
    };
  }
}

const POSITIVE_TAILS = [
  'Delivered right on time.', 'Packaging was neat and clean.', 'The rider was very polite.', 'Will definitely order again.',
  'Ekdom fresh, thank you FreshBasket!', 'Ordered for my parents and they liked it a lot.', 'Better than what I get from the local bazar.',
  'Good value for money.', 'Alhamdulillah, satisfied.', 'Came within the morning slot.', 'Onek valo laglo.',
];
const NEUTRAL_LINES = [
  'Quality was fine but the price is a bit higher than the local bazar.',
  'Okay overall, though the pack looked a little smaller than I expected.',
  'Decent, but my previous order of this was better.',
  'Product was good, delivery came at the very end of the slot.',
  'Thik ache, kintu packaging aro valo hote parto.',
  'Average this time. Not bad, not great.',
];
const NEUTRAL_PERISHABLE = ['One or two pieces were not as fresh as the rest.', 'Fresh enough, but a couple of pieces were bruised.'];
const NEGATIVE_LINES = [
  'Delivery was almost an hour late. Customer care did call to apologise though.',
  'Expected better for this price. Hope the next batch is better.',
  'The packet was slightly torn when it arrived.',
];
const NEGATIVE_PERISHABLE = ['Not as fresh as advertised this time, had to throw some away.', 'Arrived a bit soft and did not last more than a day.'];
const PERISHABLE_TOP = new Set(['fruits', 'vegetables', 'dairy', 'fish-meat']);

function buildReviews({ catalog, users, orders, now }) {
  const r = rngFor('reviews');
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const reviews = [];
  const taken = new Set();
  const usedText = new Map(); // productId -> Set of comments

  // Delivered purchases per (user, product) -> earliest delivered time
  const purchases = new Map();
  for (const o of orders) {
    if (!o.user_id || o.status !== 'Delivered') continue;
    const delivered = Date.parse(o.status_history[o.status_history.length - 1].at);
    for (const it of o.items) {
      const key = `${o.user_id}|${it.productId}`;
      if (!purchases.has(key) || purchases.get(key) > delivered) purchases.set(key, delivered);
    }
  }

  const rating = () => Number(r.weighted(['5', '4', '3', '2'], (x) => ({ 5: 50, 4: 33, 3: 12, 2: 5 })[x]));
  function comment(p, stars) {
    const used = usedText.get(p.id) ?? new Set();
    usedText.set(p.id, used);
    const perish = PERISHABLE_TOP.has(p.top);
    for (let attempt = 0; attempt < 12; attempt++) {
      let text;
      if (stars >= 4) {
        const base = r.pick(p.rv);
        text = r.chance(0.55) ? `${base} ${r.pick(POSITIVE_TAILS)}` : base;
      } else if (stars === 3) {
        text = r.pick(perish && r.chance(0.5) ? NEUTRAL_PERISHABLE : NEUTRAL_LINES);
      } else {
        text = r.pick(perish && r.chance(0.6) ? NEGATIVE_PERISHABLE : NEGATIVE_LINES);
      }
      if (!used.has(text)) {
        used.add(text);
        return text;
      }
    }
    return `${r.pick(p.rv)} ${r.pick(POSITIVE_TAILS)}`;
  }
  function add(userId, productId, verifiedAt) {
    const key = `${productId}|${userId}`;
    if (taken.has(key)) return;
    const p = byId.get(productId);
    if (!p) return;
    taken.add(key);
    const stars = rating();
    let at = verifiedAt ? verifiedAt + r.int(2, 96) * HOUR + r.int(0, 59) * MIN : now - r.int(1, 58) * DAY - r.int(0, 23) * HOUR;
    if (at > now - 10 * MIN) at = now - r.int(10, 90) * MIN;
    if (verifiedAt && at < verifiedAt) at = verifiedAt + 30 * MIN;
    reviews.push({
      product_id: productId, user_id: userId, author_name: userById.get(userId).name, rating: stars,
      comment: comment(p, stars), verified_purchase: Boolean(verifiedAt), approved: true, created_at: iso(at),
    });
  }

  // Verified reviews from real (demo) purchases first.
  for (const [key, deliveredAt] of [...purchases.entries()].sort()) {
    if (deliveredAt > now) continue;
    const [userId, productId] = key.split('|');
    if (r.chance(0.6)) add(userId, productId, deliveredAt);
  }
  // Top up with unverified reviews, weighted towards popular products.
  const target = 120;
  let guard = 0;
  while (reviews.length < target && guard++ < 5000) {
    const u = r.weighted(users, (x) => x.loyalty);
    const p = r.weighted(catalog, (x) => x.popularity ?? 3);
    add(u.id, p.id, null);
  }
  return reviews;
}

const CONTACT_MESSAGES = [
  { name: 'Nusrat Jahan', email: `nusrat.jahan@${DEMO_DOMAIN}`, phone: '01700000101', subject: 'Delivery to Uttara Sector 13',
    message: 'Do you deliver to Uttara Sector 13 in the morning slot? My building is near the lake park.', days: 21 },
  { name: 'Kamrul Islam', email: `kamrul.islam@${DEMO_DOMAIN}`, phone: '01700030014', subject: 'Bulk order for office',
    message: 'We need tea, sugar and biscuits every week for our office in Mirpur (about 40 people). Can you offer a monthly corporate rate?', days: 14 },
  { name: 'Tasnim Chowdhury', email: `tasnim.chowdhury@${DEMO_DOMAIN}`, phone: null, subject: 'Khejur gur availability',
    message: 'When will the new season khejur gur be back in stock? I would like to pre-order 2 kg.', days: 4 },
  { name: 'Rezaul Karim', email: `rezaul.karim@${DEMO_DOMAIN}`, phone: '01700030131', subject: 'Payment refund',
    message: 'I cancelled order after paying with bKash. How many days does the refund take?', days: 9 },
  { name: 'Sadia Islam', email: `sadia.islam@${DEMO_DOMAIN}`, phone: '01700000129', subject: 'Great service',
    message: 'Just wanted to say the fish was very fresh and the rider was extremely polite. Keep it up!', days: 2 },
  { name: 'Anika Tabassum', email: `anika.tabassum@${DEMO_DOMAIN}`, phone: null, subject: 'Courier to Chattogram',
    message: 'My last order to Panchlaish took 3 days. Is there any faster option for Chattogram? I am happy to pay a bit more.', days: 0.2 },
  { name: 'Mahbub Alam', email: `mahbub.alam@${DEMO_DOMAIN}`, phone: '01700000185', subject: 'Wrong item in my order',
    message: 'I ordered Rupchanda chinigura rice but got the 5 kg loose rice instead. Can someone call me to exchange it?', days: 0.6 },
  { name: 'Priya Das', email: `priya.das@${DEMO_DOMAIN}`, phone: null, subject: 'Puja order',
    message: 'We need fruits, sweets and ghee for a family puja next Friday. Can you deliver a large order early in the morning?', days: 1 },
  { name: 'Biplob Saha', email: `biplob.saha@${DEMO_DOMAIN}`, phone: '01700030209', subject: 'Delivery to Narayanganj',
    message: 'Do you deliver to Chashara, Narayanganj? The checkout shows courier delivery — how many days does it take?', days: 3 },
  { name: 'Lamia Islam', email: `lamia.islam@${DEMO_DOMAIN}`, phone: null, subject: 'bKash payment failed',
    message: 'My bKash payment showed failed but money was cut from my account. Order was not placed. Please check.', days: 5 },
  { name: 'Rifat Chowdhury', email: `rifat.chowdhury@${DEMO_DOMAIN}`, phone: '01700000157', subject: 'Corporate gift baskets',
    message: 'Can you make 25 fruit gift baskets for our office event? Budget around 1500 taka each.', days: 7 },
  { name: 'Shirin Sultana', email: `shirin.sultana@${DEMO_DOMAIN}`, phone: null, subject: 'Mango season pre-order',
    message: 'Please let me know when Rajshahi himsagar pre-orders open. I would like 20 kg for my family in Dhaka.', days: 12 },
  { name: 'Fahim Ahmed', email: `fahim.ahmed@${DEMO_DOMAIN}`, phone: null, subject: 'App?',
    message: 'Do you have a mobile app? Ordering from the website is easy but an app with saved orders would be great.', days: 18 },
  { name: 'Mizanur Rahman', email: `mizanur.rahman@${DEMO_DOMAIN}`, phone: '01700030248', subject: 'Packaging feedback',
    message: 'Eggs arrived well packed this time, thank you. The plastic bags could be replaced with paper bags though.', days: 26 },
];
const NEWSLETTER = [
  'nusrat.jahan', 'farhana.rahman', 'sadia.islam', 'tasnim.chowdhury', 'shahriar.alam', 'ayesha.siddiqua', 'nadia.sultana', 'asif.iqbal', 'mahmuda.khatun',
  'sumaiya.akter', 'rifat.chowdhury', 'priya.das', 'lamia.islam', 'anika.tabassum', 'tahmina.begum', 'kaniz.fatema', 'nafis.iqbal', 'biplob.saha',
  'rina.dey', 'hasan.mahmud', 'shaila.parvin', 'tanjim.ahmed', 'maliha.noor', 'raihan.kabir', 'sharif.uddin', 'nabila.haque', 'arafat.rahman',
  'tamanna.akter', 'sakib.hassan', 'mouri.islam',
].map((n, i) => ({ email: `${n}@${DEMO_DOMAIN}`, days: (i * 37) % 88 }));

// ---------------------------------------------------------------------------
// Auth admin API
// ---------------------------------------------------------------------------

async function authAdmin(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    ...init,
    headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`auth ${path}: HTTP ${res.status} ${body.msg ?? body.message ?? ''}`);
  return body;
}
async function listAllUsers() {
  const all = [];
  for (let page = 1; page < 50; page++) {
    const body = await authAdmin(`users?page=${page}&per_page=200`);
    all.push(...(body.users ?? []));
    if ((body.users ?? []).length < 200) break;
  }
  return all;
}
const isDemoUser = (u) => u.app_metadata?.demo === true && (u.email ?? '').endsWith(`@${DEMO_DOMAIN}`);

async function demoOrderRows() {
  const rows = await must(
    sb.from('orders').select('*').like('customer_phone', `${DEMO_PHONE_PREFIX}%`).order('created_at'),
    'read demo orders',
  );
  return rows.filter((o) => !LEGACY_ORDER_IDS.has(o.id) && (!o.customer_email || o.customer_email.endsWith(`@${DEMO_DOMAIN}`)));
}

// ---------------------------------------------------------------------------
// --reset
// ---------------------------------------------------------------------------

async function reset() {
  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}Removing demo data…`);
  const users = (await listAllUsers()).filter(isDemoUser);
  const orders = await demoOrderRows();
  const userIds = users.map((u) => u.id);
  const demoProductIds = DEMO_PRODUCTS.map((p) => p.id);
  const newCategoryIds = [...SUBCATEGORY_IDS, ...NEW_TOP_LEVEL_IDS];
  console.log(`  ${users.length} demo users, ${orders.length} demo orders, ${demoProductIds.length} demo products, ${newCategoryIds.length} demo categories`);
  if (DRY_RUN) return;

  if (userIds.length) await must(sb.from('reviews').delete().in('user_id', userIds), 'delete demo reviews');
  await must(sb.from('reviews').delete().in('product_id', demoProductIds), 'delete reviews of demo products');
  for (let i = 0; i < orders.length; i += 100) {
    await must(sb.from('orders').delete().in('id', orders.slice(i, i + 100).map((o) => o.id)), 'delete demo orders');
  }
  if (userIds.length) await must(sb.from('profiles').delete().in('id', userIds), 'delete demo profiles');
  for (const u of users) await authAdmin(`users/${u.id}`, { method: 'DELETE' });

  for (const [id, category] of Object.entries(ORIGINAL_PRODUCT_CATEGORY)) {
    await must(sb.from('products').update({ category, rating: ORIGINAL_RATINGS[id], review_count: 0 }).eq('id', id), `restore ${id}`);
  }
  await must(sb.from('products').delete().in('id', demoProductIds), 'delete demo products');
  // Products added later by the shop owner into a demo category move up to its top-level parent.
  for (const parent of CATEGORY_TREE) {
    const childIds = parent.children.map((c) => c[0]);
    const target = ORIGINAL_CATEGORY_IDS.includes(parent.id) ? parent.id : null;
    if (target) await must(sb.from('products').update({ category: target }).in('category', childIds), 'move products up');
  }
  await must(sb.from('categories').delete().in('id', SUBCATEGORY_IDS), 'delete demo subcategories');
  const { error: topErr } = await sb.from('categories').delete().in('id', NEW_TOP_LEVEL_IDS);
  if (topErr) console.warn(`  ! could not delete new top-level categories (products still use them?): ${topErr.message}`);

  await must(sb.from('coupons').delete().in('code', DEMO_COUPONS.map((c) => c.code)), 'delete demo coupons');
  await must(sb.from('coupons').update({ used_count: 0 }).in('code', ORIGINAL_COUPON_CODES), 'reset coupon usage');
  await must(sb.from('contact_messages').delete().like('email', `%@${DEMO_DOMAIN}`), 'delete demo messages');
  await must(sb.from('newsletter_subscribers').delete().like('email', `%@${DEMO_DOMAIN}`), 'delete demo subscribers');
  console.log('✔ Demo data removed (original products, coupons, legacy orders and the admin user were kept).');
}

// ---------------------------------------------------------------------------
// --refresh: drop demo ACTIVITY so seed() regenerates it up to today.
// Catalogue rows, real orders, real customers and the admin are untouched.
// ---------------------------------------------------------------------------

async function clearActivity() {
  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}Clearing demo activity (orders, reviews, messages, subscribers)…`);
  const users = (await listAllUsers()).filter(isDemoUser);
  const orders = await demoOrderRows();
  console.log(`  ${orders.length} demo orders, reviews by ${users.length} demo customers`);
  if (DRY_RUN) return;
  if (users.length) await must(sb.from('reviews').delete().in('user_id', users.map((u) => u.id)), 'delete demo reviews');
  for (let i = 0; i < orders.length; i += 100) {
    await must(sb.from('orders').delete().in('id', orders.slice(i, i + 100).map((o) => o.id)), 'delete demo orders');
  }
  await must(sb.from('contact_messages').delete().like('email', `%@${DEMO_DOMAIN}`), 'delete demo messages');
  await must(sb.from('newsletter_subscribers').delete().like('email', `%@${DEMO_DOMAIN}`), 'delete demo subscribers');
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  const now = Date.now();
  const W = DRY_RUN ? '[dry-run] would ' : '';

  // --- Image check
  const categories = categoryRows();
  const imageUrls = new Set([
    ...categories.map((c) => c.image),
    ...DEMO_PRODUCTS.flatMap((p) => [p.image, ...p.images]),
    ...Object.values(PRODUCT_IMAGE_FIXES).flatMap((f) => [f.image, ...f.images]),
  ]);
  if (REFRESH) imageUrls.clear(); // --refresh writes no catalogue rows
  console.log(`Checking ${imageUrls.size} image URLs…`);
  const results = await mapLimit([...imageUrls], 8, async (url) => [url, await checkImage(url)]);
  const broken = results.filter(([, err]) => err);
  if (broken.length) fail(`Broken image URLs:\n${broken.map(([u, e]) => `  ${e}  ${u}`).join('\n')}`);
  console.log(`  ✔ all ${imageUrls.size} images return 200 image/*`);

  // --- Remove the end-to-end test order (restore stock first)
  const testOrder = await must(sb.from('orders').select('id,status').eq('id', TEST_ORDER_ID).maybeSingle(), 'read test order');
  if (testOrder) {
    console.log(`${W}cancel + delete test order ${TEST_ORDER_ID} (status ${testOrder.status})`);
    if (!DRY_RUN) {
      if (testOrder.status !== 'Cancelled') await must(sb.rpc('set_order_status', { p_id: TEST_ORDER_ID, p_status: 'Cancelled' }), 'cancel test order');
      await must(sb.from('orders').delete().eq('id', TEST_ORDER_ID), 'delete test order');
    }
  }

  // --- Categories (parents before children)
  console.log(`${W}upsert ${categories.length} categories${REFRESH ? ' (skipped: --refresh)' : ''}`);
  if (!DRY_RUN && !REFRESH) {
    await must(sb.from('categories').upsert(categories.filter((c) => !c.parent_id), { onConflict: 'id' }), 'upsert parent categories');
    await must(sb.from('categories').upsert(categories.filter((c) => c.parent_id), { onConflict: 'id' }), 'upsert subcategories');
  }

  // --- Existing products → subcategories (+ image fixes)
  const existing = await must(sb.from('products').select('*'), 'read products');
  const existingIds = new Set(existing.map((p) => p.id));
  for (const [id, sub] of Object.entries(PRODUCT_SUBCATEGORY)) {
    if (!existingIds.has(id)) continue;
    const patch = { category: sub, ...(PRODUCT_IMAGE_FIXES[id] ?? {}) };
    if (!DRY_RUN && !REFRESH) await must(sb.from('products').update(patch).eq('id', id), `move ${id}`);
  }
  console.log(`${W}move ${Object.keys(PRODUCT_SUBCATEGORY).length} original products into subcategories${REFRESH ? " (skipped: --refresh)" : ""}`);

  // --- Demo products: insert new ones; for existing demo rows refresh catalogue
  // text/images but keep stock, sold_count and rating (they change in real use).
  const productRows = DEMO_PRODUCTS.map(({ rv, ...p }) => ({ ...p, active: true }));
  const newRows = productRows.filter((p) => !existingIds.has(p.id));
  console.log(`${W}insert ${newRows.length} demo products (${productRows.length - newRows.length} already present)${REFRESH ? ' (skipped: --refresh)' : ''}`);
  if (!DRY_RUN && !REFRESH) {
    if (newRows.length) await must(sb.from('products').insert(newRows), 'insert demo products');
    for (const p of productRows.filter((x) => existingIds.has(x.id))) {
      const { stock, sold_count, ...rest } = p;
      await must(sb.from('products').update(rest).eq('id', p.id), `update ${p.id}`);
    }
  }

  // --- Coupons (used_count set after orders)
  console.log(`${W}upsert ${DEMO_COUPONS.length} demo coupons${REFRESH ? ' (skipped: --refresh)' : ''}`);
  if (!DRY_RUN && !REFRESH) {
    await must(sb.from('coupons').upsert(DEMO_COUPONS.map(({ base_used, ...c }) => ({ ...c, used_count: base_used })), { onConflict: 'code', ignoreDuplicates: true }), 'insert coupons');
  }

  // --- Demo users + profiles
  const authUsers = await listAllUsers();
  const byEmail = new Map(authUsers.map((u) => [u.email, u]));
  const users = [];
  let created = 0;
  for (const du of DEMO_USERS) {
    let au = byEmail.get(du.email);
    if (au && !isDemoUser(au)) fail(`${du.email} exists but is not marked as a demo user; refusing to touch it.`);
    if (!au) {
      created++;
      if (DRY_RUN) au = { id: `00000000-0000-4000-8000-${String(users.length).padStart(12, '0')}` };
      else {
        au = await authAdmin('users', {
          method: 'POST',
          body: JSON.stringify({
            email: du.email,
            password: `${randomBytes(18).toString('base64url')}!9a`,
            email_confirm: true,
            user_metadata: { full_name: du.name },
            app_metadata: { demo: true },
          }),
        });
      }
    }
    users.push({ ...du, id: au.id });
  }
  console.log(`${W}create ${created} demo users (${DEMO_USERS.length - created} already exist)`);
  if (!DRY_RUN) {
    await must(
      sb.from('profiles').upsert(
        users.map((u) => ({
          id: u.id, full_name: u.name, phone: u.phone, address: u.address, area: u.area,
          city: u.district ?? 'Dhaka', division: u.division ?? 'Dhaka', district: u.district ?? 'Dhaka', upazila: u.area,
        })),
        { onConflict: 'id' },
      ),
      'upsert profiles',
    );
  }

  // --- Catalog for orders/reviews
  const parentOf = new Map(categories.map((c) => [c.id, c.parent_id ?? c.id]));
  const catalog = [
    ...existing.filter((p) => ORIGINAL_PRODUCT_CATEGORY[p.id]).map((p) => ({
      ...p, ...(PRODUCT_IMAGE_FIXES[p.id] ?? {}), price: Number(p.price), popularity: ORIGINAL_POPULARITY[p.id] ?? 3,
      rv: ORIGINAL_RV[p.id] ?? ['Good quality, as described.'], top: ORIGINAL_PRODUCT_CATEGORY[p.id],
    })),
    ...DEMO_PRODUCTS.map((p) => ({ ...p, popularity: Math.max(1, Math.round(p.sold_count / 160)), top: parentOf.get(p.category) })),
  ];

  // --- Orders
  let orders = DRY_RUN ? [] : await demoOrderRows();
  if (orders.length) {
    console.log(`  demo orders already present (${orders.length}) — not generating more`);
  } else {
    const all = await must(sb.from('orders').select('id'), 'read order ids');
    const built = buildOrders({ catalog, users, now, takenIds: all.map((o) => o.id) });
    console.log(`${W}insert ${built.length} demo orders`);
    const rows = built.map(({ _created, ...o }) => o);
    if (!DRY_RUN) {
      await must(sb.from('orders').insert(rows), 'insert demo orders');
      orders = await demoOrderRows();
    } else orders = rows;
  }

  // --- Coupon usage = baseline + demo orders that used it
  const usage = {};
  for (const o of orders) if (o.coupon_code) usage[o.coupon_code] = (usage[o.coupon_code] ?? 0) + 1;
  if (!DRY_RUN) {
    for (const code of ORIGINAL_COUPON_CODES) await must(sb.from('coupons').update({ used_count: usage[code] ?? 0 }).eq('code', code), 'coupon usage');
    for (const c of DEMO_COUPONS) await must(sb.from('coupons').update({ used_count: c.base_used + (usage[c.code] ?? 0) }).eq('code', c.code), 'coupon usage');
  }

  // --- Reviews
  const existingReviews = DRY_RUN || !users.length ? [] : await must(sb.from('reviews').select('id').in('user_id', users.map((u) => u.id)), 'read reviews');
  if (existingReviews.length) {
    console.log(`  demo reviews already present (${existingReviews.length}) — not generating more`);
  } else {
    const reviews = buildReviews({ catalog, users, orders, now });
    console.log(`${W}insert ${reviews.length} reviews (${reviews.filter((x) => x.verified_purchase).length} verified purchases)`);
    if (!DRY_RUN) await must(sb.from('reviews').upsert(reviews, { onConflict: 'product_id,user_id', ignoreDuplicates: true }), 'insert reviews');
  }

  // --- Contact messages + newsletter
  const haveMsgs = DRY_RUN ? [] : await must(sb.from('contact_messages').select('email,subject').like('email', `%@${DEMO_DOMAIN}`), 'read messages');
  const msgKeys = new Set(haveMsgs.map((m) => `${m.email}|${m.subject}`));
  const newMsgs = CONTACT_MESSAGES.filter((m) => !msgKeys.has(`${m.email}|${m.subject}`))
    .map(({ days, ...m }) => ({ ...m, created_at: iso(now - days * DAY - 3 * HOUR) }));
  console.log(`${W}insert ${newMsgs.length} contact messages`);
  if (!DRY_RUN && newMsgs.length) await must(sb.from('contact_messages').insert(newMsgs), 'insert messages');
  console.log(`${W}upsert ${NEWSLETTER.length} newsletter subscribers`);
  if (!DRY_RUN) {
    await must(sb.from('newsletter_subscribers').upsert(NEWSLETTER.map(({ email, days }) => ({ email, created_at: iso(now - days * DAY) })), { onConflict: 'email', ignoreDuplicates: true }), 'subscribers');
  }

  if (DRY_RUN) {
    const st = {};
    for (const o of orders) st[o.status] = (st[o.status] ?? 0) + 1;
    for (const o of orders.slice(-8)) console.log(`   ${o.id} ${o.created_at} ${o.status.padEnd(16)} ${o.payment_method}/${o.payment_status} ৳${o.total} ${o.delivery_slot}`);
    console.log('  dry-run order status mix:', st, `| online ${orders.filter((o) => o.payment_method === 'sslcommerz').length} | linked ${orders.filter((o) => o.user_id).length}`);
    return;
  }

  // --- Revalidate a local storefront if one is running
  try {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const res = await fetch(`${site}/api/revalidate`, {
      method: 'POST', signal: AbortSignal.timeout(3000),
      headers: { Authorization: `Bearer ${process.env.REVALIDATE_SECRET ?? ''}` },
    });
    console.log(`  revalidated local storefront (HTTP ${res.status})`);
  } catch {
    // no local server — nothing to refresh
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

async function summary() {
  console.log('\n— Summary —');
  for (const t of ['categories', 'products', 'coupons', 'orders', 'reviews', 'profiles', 'contact_messages', 'newsletter_subscribers']) {
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${t.padEnd(24)} ${count}`);
  }
  const users = (await listAllUsers()).filter(isDemoUser);
  console.log(`  ${'demo auth users'.padEnd(24)} ${users.length}`);
  const cats = await must(sb.from('categories').select('id,name,parent_id,sort_order').order('sort_order'), 'categories');
  const prods = await must(sb.from('products').select('category'), 'products');
  const perCat = {};
  for (const p of prods) perCat[p.category] = (perCat[p.category] ?? 0) + 1;
  console.log('\nCategory tree (products per category):');
  for (const top of cats.filter((c) => !c.parent_id)) {
    const kids = cats.filter((c) => c.parent_id === top.id);
    const total = (perCat[top.id] ?? 0) + kids.reduce((s, k) => s + (perCat[k.id] ?? 0), 0);
    console.log(`  ${top.name} [${top.id}] — ${total}${perCat[top.id] ? ` (${perCat[top.id]} directly)` : ''}`);
    for (const k of kids) console.log(`     └ ${k.name} [${k.id}] — ${perCat[k.id] ?? 0}`);
  }
}

if (RESET) await reset();
else {
  if (REFRESH) await clearActivity();
  await seed();
}
if (!DRY_RUN) await summary();
console.log('');
