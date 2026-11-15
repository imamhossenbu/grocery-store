# 🛒 FreshBasket — Grocery Storefront

An online grocery store for Bangladesh: prices in BDT (৳), same-day delivery slots in Dhaka, courier delivery to every other district, and payment by cash on delivery or online (bKash, Nagad, Rocket and cards through SSLCommerz).

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3FCF8E?logo=supabase&logoColor=white)

This is the customer-facing half of FreshBasket. The store is managed from a separate app, the [FreshBasket Admin Panel](https://github.com/imamhossenbu/grocery-admin-panel), which shares the same Supabase project.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Install](#1-install)
  - [2. Environment variables](#2-environment-variables)
  - [3. Create the database](#3-create-the-database)
  - [4. Run](#4-run)
- [Scripts](#scripts)
- [Demo data](#demo-data)
- [Delivery charges](#delivery-charges)
- [Online payment (SSLCommerz)](#online-payment-sslcommerz)
  - [Payment flow](#payment-flow)
  - [Abandoned payments](#abandoned-payments)
  - [Testing in the sandbox](#testing-in-the-sandbox)
  - [Going live](#going-live)
- [Order confirmation emails](#order-confirmation-emails)
- [Catalog revalidation](#catalog-revalidation)
- [Route map](#route-map)
- [Project structure](#project-structure)
- [Security notes](#security-notes)
- [Migrating from the legacy JSON file](#migrating-from-the-legacy-json-file)
- [Related repository](#related-repository)

## Features

**Catalog**

- Home page with hero, category grid, deals countdown and product rails
- Shop page with URL-driven filters, price slider, sorting and pagination
- Two-level category tree, search with a suggestions panel, and a deals page
- Product pages with image gallery, tabs, reviews and recently viewed products
- SEO: sitemap, robots, canonical links and JSON-LD product data

**Buying**

- Basket with a live price and stock re-check, coupons validated against the database, and free-delivery progress
- Checkout with Bangladeshi mobile number validation and an address picker (district → upazila or thana → area)
- Same-day delivery slots in Dhaka, courier delivery for other districts
- Cash on delivery or online payment through the SSLCommerz hosted gateway
- Order confirmation page with a private link, printable invoice and payment status
- Order tracking by order ID and phone number
- Optional order confirmation email

**Accounts**

- Email and password sign-up, confirmed with a 6-digit code; password reset
- Account dashboard: overview with spending chart, orders, wishlist, reviews, profile, security and support
- Saved delivery details and one-click reorder

**Other**

- Info pages: about, contact, delivery, FAQ, returns, privacy and terms
- Newsletter sign-up and a contact form
- Custom UI kit (no native selects, checkboxes or confirm dialogs), motion, and loading skeletons on every route

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, `motion`, `lucide-react` |
| Database and auth | Supabase (Postgres with Row Level Security, Supabase Auth) |
| Payments | SSLCommerz hosted gateway |
| Email | Nodemailer over SMTP |
| Images | Cloudinary |
| Address data | `bangladesh-geo-data` |

## How it works

- **The database decides the price.** Orders are created by one Postgres function, `place_order`, which re-prices every item, checks stock and coupons, works out the delivery fee and decrements stock in a single transaction. The browser only sends product ids and quantities.
- **Private data stays on the server.** Row Level Security is on for every table. The public key can only read the catalog; orders, coupons and profiles are read on the server with the secret key.
- **Catalog pages are cached.** They are served from the cache (tag `catalog`) and refreshed when the admin panel calls [`/api/revalidate`](#catalog-revalidation), or when an order changes stock.
- **Demo mode.** Until the database schema is applied, the storefront shows a bundled sample catalog and refuses orders ("Online ordering is not available yet").

## Getting started

### Prerequisites

- Node.js 20.9 or newer, and npm
- A [Supabase](https://supabase.com) project
- Optional: a Cloudinary account, SSLCommerz store credentials and an SMTP account

### 1. Install

```bash
git clone https://github.com/imamhossenbu/grocery-store.git
cd grocery-store
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored. Never commit real keys.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Public key (auth cookies, RLS-protected reads) |
| `SUPABASE_SECRET_KEY` | Yes | **Server only.** Orders, coupons and profiles. Never expose it to the browser |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL, no trailing slash. Used for canonical links, the sitemap, order links and payment callbacks |
| `REVALIDATE_SECRET` | Yes | Shared secret for `POST /api/revalidate` and `POST /api/payment/expire`. At least 16 characters, and the same value as in the admin panel |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No | Product images |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | No | **Server only.** Leave empty to offer cash on delivery only |
| `SSLCOMMERZ_SANDBOX` | No | `true` (default) uses the sandbox gateway; `false` uses the live gateway |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | No | Order confirmation emails. Without them no email is sent |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Create the database

Open **Supabase Dashboard → SQL Editor**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and run it.

It creates the tables, the Row Level Security policies and the order and payment functions. It is safe to re-run, and re-running it upgrades a database created by an older version.

> The same `supabase/schema.sql` lives in the admin panel repository. The two copies must stay identical.

| Tables | Functions |
| --- | --- |
| `categories`, `products`, `coupons`, `orders`, `reviews`, `profiles`, `newsletter_subscribers`, `contact_messages`, `store_settings` | `place_order`, `set_order_status`, `delivery_fee_for`, `mark_order_paid`, `mark_payment_failed`, `expire_stale_payments` |

To fill an empty database with realistic sample data, see [Demo data](#demo-data).

### 4. Run

```bash
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
```

The admin panel runs on port 3001.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:seed-demo` | Fill the database with demo data (see below) |
| `npm run db:migrate` | Copy data from the legacy JSON file (see [Migrating](#migrating-from-the-legacy-json-file)) |

## Demo data

`scripts/seed-demo.mjs` fills the database with realistic data for a Dhaka grocery store: a category tree with subcategories, 40 extra products, 4 extra coupons, 30 demo customers with profiles (6 of them outside Dhaka), orders spread over the last 90 days, about 120 reviews, and a few contact messages and newsletter subscribers.

```bash
npm run db:seed-demo -- --dry-run   # check every image URL and show what would be written; writes nothing
npm run db:seed-demo                # seed (safe to re-run; demo rows are not duplicated)
npm run db:seed-demo -- --refresh   # rebuild demo activity up to today; never writes products, categories or coupons
npm run db:seed-demo -- --reset     # remove only the demo rows
```

How the script recognises demo rows (the same rules drive re-runs and `--reset`):

- **Users:** `app_metadata.demo = true` and an email ending in `@demo.freshbasket.test`. Their passwords are random and never printed.
- **Orders:** the phone number starts with `017000` (a reserved demo range) and the email is empty or `@demo.freshbasket.test`.
- **Products, categories and coupons:** the fixed ids listed in the script.
- **Reviews, messages and subscribers:** written by demo users or using demo emails.

`--reset` puts the original products back in their top-level categories and restores their ratings. It never touches real accounts.

## Delivery charges

Delivery charges are stored in the `store_settings` table and edited in the admin panel under **Settings → Delivery**.

| Area | Default fee | Default free delivery |
| --- | --- | --- |
| Dhaka district | ৳60 | Orders of ৳1,000 or more |
| Every other district | ৳130 (courier) | Never |

- `place_order()` applies the rule through `delivery_fee_for()` in the database. That is the source of truth.
- [`src/lib/pricing.ts`](src/lib/pricing.ts) mirrors the rule for what the shopper sees before ordering, and falls back to the defaults above if the settings cannot be read.
- Orders with no district count as Dhaka.

## Online payment (SSLCommerz)

Shoppers can pay with bKash, Nagad, Rocket, Visa, Mastercard, Amex and net banking on the SSLCommerz hosted payment page. The online option is enabled only when `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` are set. Cash on delivery always works.

### Payment flow

1. **Checkout.** The shopper picks "Pay online". `place_order` reserves stock, computes the total, and creates the order as `Pending` with `payment_status = 'pending'` and a random `payment_tran_id` generated in Postgres.
2. **Session.** The server opens an SSLCommerz session with the **database total** and the order's `tran_id`, then sends the browser to the gateway page. If the session cannot be opened, the order is cancelled at once, stock is restored, and the shopper is asked to retry or choose cash on delivery.
3. **Return.** SSLCommerz sends the shopper's browser back to `/api/payment/sslcommerz/success`, `fail` or `cancel`, and separately calls `/api/payment/sslcommerz/ipn` server to server. A payment is confirmed only after all of these pass:
   - `verify_sign` matches whenever a signature is present;
   - the SSLCommerz validation API answers `VALID` or `VALIDATED` for the `val_id`, with the same `tran_id`, currency `BDT`, and an amount exactly equal to the order total;
   - `mark_order_paid()` re-checks the amount under a row lock. It is idempotent, so the success redirect and the IPN can both arrive.

   The order then becomes `Confirmed` with `payment_status = 'paid'`. Fail and cancel run `mark_payment_failed()`, which cancels the order and restores stock. Paid orders are never touched.
4. **Order page.** `/order/<id>?token=…` shows the payment status from the database. A pending order has a **Complete payment** button; a failed or cancelled one offers to put the items back in the basket.

If a valid payment arrives for an order that was already cancelled, it is still recorded as `paid` with `payment_details.late_payment = true`. The order stays cancelled and the admin panel flags it **Needs refund**.

### Abandoned payments

A shopper who closes the tab on the gateway leaves a pending order holding stock. Run the expiry job every 10 to 15 minutes from any cron (GitHub Actions, cron-job.org, Vercel Cron, a server crontab):

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/payment/expire" \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
# optional: -H "Content-Type: application/json" -d '{"minutes":90}'   # default 60, minimum 15
```

It cancels online orders still pending after that many minutes and restores their stock. Responses: `{"ok":true,"cancelled":N}`, `401` for a bad secret, `503` if the database is not set up.

### Testing in the sandbox

Keep `SSLCOMMERZ_SANDBOX=true` and use sandbox store credentials (register at developer.sslcommerz.com). Test data from the SSLCommerz docs:

| Method | Number | Expiry | CVV |
| --- | --- | --- | --- |
| Visa | `4111111111111111` | 12/26 | 111 |
| Mastercard | `5111111111111111` | 12/26 | 111 |
| American Express | `371111111111111` | 12/26 | 111 |
| Mobile banking OTP | `111111` or `123456` | | |

If the gateway rejects the expiry date above, use any future date.

On `localhost` the success, fail and cancel redirects work, because it is your own browser that is sent back. The **IPN cannot reach localhost**. Locally the success redirect alone confirms the payment. To test the IPN, expose the dev server with a tunnel (ngrok, cloudflared) and set `NEXT_PUBLIC_SITE_URL` to the tunnel URL.

### Going live

1. Set live `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`, and `SSLCOMMERZ_SANDBOX=false`.
2. Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin, with no trailing slash. The callback and IPN URLs are built from it.
3. In the SSLCommerz merchant panel, set the IPN URL to `https://<your-domain>/api/payment/sslcommerz/ipn`.
4. Schedule the [expiry cron](#abandoned-payments).

## Order confirmation emails

When SMTP is configured, the shopper receives a confirmation at the email address entered at checkout: cash on delivery orders when they are placed, online orders once they are paid.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_letter_app_password
MAIL_FROM="FreshBasket <your_gmail_address@gmail.com>"
```

For Gmail, turn on 2-Step Verification and create an App Password at myaccount.google.com/apppasswords. Without these variables no email is sent and checkout works as before.

Sign-up and password reset emails are sent by Supabase Auth. Their branded templates are built by [`supabase/email-templates/build.py`](supabase/email-templates/build.py).

## Catalog revalidation

Catalog pages are cached. After products, categories, coupons or settings change, the admin panel calls:

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/revalidate" \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags":["reviews:<productId>","settings"]}'   # body is optional
```

- The `catalog` tag is always refreshed.
- The optional body can add `reviews:<productId>` tags and `settings` (delivery charges).
- `settings` expires at once, so no shopper sees a delivery fee that `place_order()` would no longer charge.

Responses: `200` revalidated, `400` invalid JSON body, `401` wrong or missing secret, `500` `REVALIDATE_SECRET` not configured.

## Route map

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | All products with filters, sorting and pagination |
| `/category`, `/category/[slug]` | Category index and listing (both levels) |
| `/search?q=` | Search results |
| `/deals` | Discounted products |
| `/product/[slug]` | Product details and reviews |
| `/cart` | Basket: quantities, live price and stock check, coupons, order summary |
| `/checkout` | Contact, address, delivery slot and payment |
| `/order/[id]?token=` | Order details, printable invoice and payment status. Opens only with the order's private token or for the signed-in owner |
| `/track-order?id=` | Order status lookup by order ID and phone number |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback` | Sign in, sign up, password reset and auth callback |
| `/account`, `/account/{orders,wishlist,reviews,profile,security,support}` | Account dashboard |
| `/wishlist` | Saved products |
| `/about`, `/contact`, `/delivery`, `/faq`, `/returns`, `/privacy`, `/terms` | Info pages |

| API route | Purpose |
| --- | --- |
| `GET /api/address`, `GET /api/address/[district]` | Divisions, districts, upazilas and areas for the address picker |
| `POST /api/revalidate` | Cache refresh for the admin panel (bearer secret) |
| `POST /api/payment/sslcommerz/{success,fail,cancel}` | Browser return from the SSLCommerz gateway |
| `POST /api/payment/sslcommerz/ipn` | SSLCommerz server-to-server payment notification |
| `POST /api/payment/expire` | Cancel abandoned online payments (bearer secret, for a cron) |

## Project structure

```text
grocery-store/
├── scripts/
│   ├── seed-demo.mjs            # demo data
│   └── migrate-from-json.mjs    # one-time legacy import
├── supabase/
│   ├── schema.sql               # tables, RLS policies, functions
│   └── email-templates/         # Supabase Auth email templates
└── src/
    ├── actions/                 # server actions: auth, account, orders, reviews, contact
    ├── app/                     # routes (App Router) and API route handlers
    ├── components/              # account, address, cart, home, product, shop, ui, …
    ├── context/                 # ShopContext (basket, wishlist, delivery settings)
    ├── lib/
    │   ├── data/                # catalog, orders, account and settings reads
    │   ├── payments/            # SSLCommerz client, callbacks, service
    │   ├── email/               # mailer and order confirmation
    │   ├── address/             # Bangladesh address data and formatting
    │   ├── supabase/            # browser, server and secret-key clients
    │   └── pricing.ts           # delivery fee and discount display rules
    ├── proxy.ts                 # session refresh and /account redirects
    └── types/
```

## Security notes

- Prices, totals, discounts, delivery fees and stock are always computed in Postgres (`place_order`). Client values are display-only.
- Online payments are never trusted from the browser. Every success redirect and IPN is checked against the SSLCommerz validation API and `verify_sign`, then applied by a locked, idempotent database function. The order-page token is looked up from the `tran_id` and never read from the callback body.
- Orders, coupons and profiles are readable only with the secret key on the server. Guests reach their own order through an unguessable access token in the link. Order pages are `noindex` and send no referrer.
- `src/proxy.ts` refreshes the session and redirects, but it is not the authorization layer. Every Server Component and Server Action that touches private data verifies the user again.
- Placing orders, coupon checks and order tracking have a per-IP rate limit, and checkout has a honeypot field. The rate limiter is **in memory per server instance**: it resets on restart and is not shared across instances. In production, put a shared limiter (Redis, Upstash or your host's WAF rules) in front of it.

## Migrating from the legacy JSON file

Only needed if you have data from the old version, which kept everything in `ecommerce-store/database.json` in Supabase Storage.

```bash
npm run db:migrate -- --dry-run   # preview: reads and transforms, writes nothing
npm run db:migrate                # copy categories, products, coupons and orders
```

The script is idempotent. By default it only inserts rows that do not exist yet, so re-running never overwrites stock or prices changed since. Pass `--overwrite` to also update existing categories, products and coupons from the file. Orders are always insert-only.

> **Important:** `database.json` contains customer names, phone numbers and addresses and is publicly readable. After the migration succeeds, make the `ecommerce-store` storage bucket private or delete the file (Dashboard → Storage → `ecommerce-store`).

## Related repository

- [grocery-admin-panel](https://github.com/imamhossenbu/grocery-admin-panel): the admin dashboard for orders, products, categories, coupons, customers, reviews and store settings.
