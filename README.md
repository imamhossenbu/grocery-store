# FreshBasket Grocery Storefront

Online grocery store for Dhaka, Bangladesh — prices in BDT (৳), same-day delivery slots, cash on delivery or online payment (bKash, Nagad, Rocket, cards… through SSLCommerz).
Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4 and Supabase (Postgres + Auth).

## Features

- Multi-page storefront: home, shop with filters, categories, search, deals, product pages with reviews
- Basket page with live price/stock re-check, coupons validated against the database, free-delivery progress
- Checkout with Bangladeshi mobile validation, Dhaka areas, delivery day + slot, cash on delivery or online payment via the SSLCommerz hosted gateway
- Orders are created by one database function (`place_order`) that re-prices every item, checks stock and coupons, and decrements stock in a single transaction — the browser only ever sends product ids and quantities
- Order confirmation page (private link with access token, printable invoice) and order tracking by order ID + phone
- Accounts (Supabase Auth): saved delivery details, order history, wishlist

## Setup

### 1. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public key (auth cookies, RLS-protected reads) |
| `SUPABASE_SECRET_KEY` | **Server only.** Orders, coupons, profiles. Never expose it to the browser |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for canonical links, the sitemap and order links |
| `REVALIDATE_SECRET` | Shared secret for `POST /api/revalidate` (see below) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Product image uploads |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | **Server only.** SSLCommerz store credentials. Leave empty to offer cash on delivery only |
| `SSLCOMMERZ_SANDBOX` | `true` (default) uses `sandbox.sslcommerz.com`; `false` uses the live gateway `securepay.sslcommerz.com` |

### 2. Create the database

Open **Supabase Dashboard → SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.
It creates the tables, Row Level Security policies and the `place_order` / `set_order_status` / payment functions. It is safe to re-run,
and re-running it upgrades a database created by an older version (it adds the payment columns and replaces `place_order`).

Until this is done the storefront runs in **demo mode**: it shows the bundled sample catalog and refuses orders
("Online ordering is not available yet").

### 3. Copy the existing data

```bash
npm install
npm run db:migrate -- --dry-run   # preview: reads and transforms, writes nothing
npm run db:migrate                # copy categories, products, coupons and orders
```

The script reads the legacy `ecommerce-store/database.json` from Supabase Storage (falling back to
`src/lib/seed-data.ts` if it can't be fetched). It is idempotent: by default it only inserts rows that don't exist
yet, so re-running never overwrites stock or prices changed since. Pass `--overwrite` to also update existing
categories, products and coupons from the file. Orders are always insert-only.

### 4. Lock down the old JSON file — important

`database.json` contains customer names, phone numbers and addresses and is publicly readable.
After the migration succeeds, **make the `ecommerce-store` storage bucket private, or delete `database.json`**
(Dashboard → Storage → `ecommerce-store`).

### 5. Run

```bash
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Demo data

`scripts/seed-demo.mjs` fills the database with realistic demo data for a Dhaka grocery store: a category tree with subcategories (the 18 original products move into subcategories), 40 more products, 4 extra coupons, 12 demo customers with profiles, ~85 orders over the last 60 days, ~120 reviews (the rating trigger updates the products), and a few contact messages and newsletter subscribers. It also deletes the end-to-end test order `FB-134453` after putting its stock back.

```bash
npm run db:seed-demo -- --dry-run   # checks every image URL and shows what would be written, writes nothing
npm run db:seed-demo                # seed (safe to re-run; existing demo rows are not duplicated)
npm run db:seed-demo -- --reset     # remove only the demo rows
```

The script recognises demo rows like this (the same rules drive re-runs and `--reset`):

- **Users:** `app_metadata.demo = true` and an e-mail ending in `@demo.freshbasket.test`. Their passwords are random and never printed, so use the admin panel or a password reset if you need to sign in as one.
- **Orders:** the phone number starts with `017000` (a reserved demo range), and the e-mail is either empty or `@demo.freshbasket.test`.
- **Products, categories and coupons:** the fixed ids listed in the script.
- **Reviews, messages and subscribers:** written by demo users, or using demo e-mails.

`--reset` puts the original products back in their top-level categories and restores their ratings. It never touches the 4 legacy sample orders or real accounts.

## Catalog revalidation (for the admin panel)

Catalog pages are cached (tag `catalog`). After editing products, categories or coupons, the admin panel should call:

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/revalidate" \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
# optional body to also refresh a product's reviews:
#   -H "Content-Type: application/json" -d '{"tags":["reviews:<productId>"]}'
```

Responses: `200` revalidated, `401` wrong/missing secret, `500` `REVALIDATE_SECRET` not configured (min. 16 chars).
Placing an order refreshes the catalog automatically (stock changes).

## Online payment (SSLCommerz)

Shoppers can pay with bKash, Nagad, Rocket, Visa/Mastercard/Amex, net banking etc. on the SSLCommerz hosted payment
page. Cash on delivery keeps working as before; the online option only appears enabled when
`SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` are set.

### Flow

1. **Checkout** — the shopper picks "Pay online". `placeOrder` calls `place_order(..., p_payment_method => 'sslcommerz')`,
   which reserves stock, computes the total, and creates the order as `Pending` with `payment_status = 'pending'` and a
   random `payment_tran_id` (generated in Postgres).
2. **Session** — the server opens an SSLCommerz session (`/gwprocess/v4/api.php`) with the **database total**, the order's
   `tran_id`, customer/shipping fields and `value_a = <order id>`. The browser empties the basket and is sent to the
   returned `GatewayPageURL`. If the session cannot be opened, the order is cancelled at once (stock restored) and the
   shopper is asked to retry or choose cash on delivery.
3. **Return** — SSLCommerz POSTs the shopper's browser back to `/api/payment/sslcommerz/success|fail|cancel`, and
   separately POSTs `/api/payment/sslcommerz/ipn` server to server. Success and IPN are confirmed only after:
   - `verify_sign` matches (md5 of the fields named in `verify_key` plus `store_passwd = md5(store password)`, sorted by
     key, `key=value` joined with `&` — as in the official SSLCommerz library) whenever a signature is present;
   - the **validation API** (`/validator/api/validationserverAPI.php`) for the POSTed `val_id` answers `VALID` or
     `VALIDATED`, with the same `tran_id` (and `val_id` / `value_a` when returned), `currency` = `BDT`, and `amount`
     exactly equal to the order total;
   - `mark_order_paid()` re-checks the amount under a row lock. It is idempotent, so success + IPN both arriving is fine.
   The order becomes `Confirmed`, `payment_status = 'paid'`. Fail/cancel run `mark_payment_failed()`, which cancels the
   order and restores stock (paid orders are never touched). IPNs with `FAILED`/`CANCELLED`/`UNATTEMPTED`/`EXPIRED` are
   acknowledged but do not cancel anything (the shopper may still retry inside the gateway).
4. **Order page** — `/order/<id>?token=…&payment=success|failed|cancelled` shows the payment status from the database.
   A still-pending order has a **Complete payment** button that opens a new gateway session for the same `tran_id`.
   A failed/cancelled one offers to put the items back in the basket and try again (or pay cash on delivery).

If a valid payment arrives for an order that was already cancelled (e.g. after it expired), it is still recorded as
`paid` with `payment_details.late_payment = true`; the order stays cancelled and the admin panel flags it
**Needs refund** — refund it in the SSLCommerz merchant panel or re-open the order.

### Abandoned payments

A shopper who closes the tab on the gateway leaves a `pending` order holding stock. Run the expiry job every
10–15 minutes from any cron (GitHub Actions, cron-job.org, Vercel Cron, a server crontab…):

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/payment/expire" \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
# optional: -H "Content-Type: application/json" -d '{"minutes":90}'   # default 60, min 15
```

It calls `expire_stale_payments(p_minutes)` which cancels online orders still `pending` after that many minutes and
restores their stock. Response: `{"ok":true,"cancelled":N}`; `401` bad secret; `503` database not set up.

### Testing in the sandbox

Keep `SSLCOMMERZ_SANDBOX=true` with sandbox store credentials (register at developer.sslcommerz.com). Test data from the
SSLCommerz docs:

| Method | Number | Expiry | CVV |
| --- | --- | --- | --- |
| VISA | `4111111111111111` | 12/26 | 111 |
| Mastercard | `5111111111111111` | 12/26 | 111 |
| American Express | `371111111111111` | 12/26 | 111 |
| Mobile banking OTP | `111111` or `123456` | | |

(The sandbox card expiry in the docs may lag; any future date usually works.)

On `localhost` the browser redirects (success/fail/cancel) work, because it is your own browser that is sent back.
The **IPN cannot reach localhost** — SSLCommerz's servers need a public URL. Locally the success redirect alone confirms
the payment (it calls the validation API itself); to test IPN, expose the dev server with a tunnel (ngrok, cloudflared)
and set `NEXT_PUBLIC_SITE_URL` to the tunnel URL.

### Going live

1. Get live credentials from SSLCommerz and set `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` and
   `SSLCOMMERZ_SANDBOX=false`.
2. Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin (no trailing slash) — the callback and IPN URLs are built from it.
3. In the SSLCommerz merchant panel, set the IPN URL to `https://<your-domain>/api/payment/sslcommerz/ipn`
   (it is also sent with every session). The IPN must be reachable on port 443 from SSLCommerz's servers.
4. Re-run `supabase/schema.sql` if the database predates online payments, and schedule the expiry cron above.

## Route map

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | All products with filters, sorting and pagination |
| `/category/[slug]` | Category listing |
| `/search?q=` | Search results |
| `/deals` | Discounted products |
| `/product/[slug]` | Product details and reviews |
| `/cart` | Basket: quantities, live price/stock check, coupons, order summary |
| `/checkout` | Contact, address, delivery day/slot, payment (cash on delivery or online via SSLCommerz) |
| `/order/[id]?token=` | Order confirmation / details and printable invoice, payment status, "Complete payment". Only opens with the order's private token or for the signed-in owner |
| `/track-order?id=` | Order status lookup by order ID + phone number |
| `/login`, `/register`, `/auth/*` | Sign in, sign up, auth callbacks |
| `/account`, `/account/*` | Profile, saved address, order history |
| `/wishlist` | Saved products |
| `POST /api/revalidate` | Catalog cache refresh for the admin panel (bearer secret) |
| `POST /api/payment/sslcommerz/{success,fail,cancel}` | Browser return from the SSLCommerz gateway (303 to the order page) |
| `POST /api/payment/sslcommerz/ipn` | SSLCommerz server-to-server payment notification |
| `POST /api/payment/expire` | Cancel abandoned online payments (bearer secret, for a cron) |

## Security notes

- Prices, totals, discounts and stock are always computed in Postgres (`place_order`); client values are display-only.
- Online payments are never trusted from the browser: every success/IPN is checked against the SSLCommerz validation API
  (status, tran_id, currency, exact amount) and `verify_sign`, then applied by a locked, idempotent database function.
  `/api/payment/**` is excluded from `src/proxy.ts`; Route Handlers have no Origin check, so the gateway's cross-site
  POSTs are accepted. The order-page token is looked up from the `tran_id`, never read from the callback body.
- Orders, coupons and profiles are readable only with the secret key on the server. Guests reach their own order
  through an unguessable access token in the link; order pages are `noindex` and send no referrer.
- `placeOrder`, coupon checks and order tracking have a per-IP rate limit and the checkout has a honeypot field.
  The rate limiter is **in-memory per server instance** (it resets on restart and isn't shared across instances);
  in production put a shared limiter (e.g. Redis/Upstash or your host's WAF rules) in front of it.
