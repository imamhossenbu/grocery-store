# FreshBasket — project status and handoff

Last updated: 13 Nov 2026. Covers both repos:

| Repo | Branch with all the work | Dev port |
|---|---|---|
| `grocery-store` (storefront) | `feature/multi-page-store` | 3000 |
| `grocery-admin-panel` (admin) | `feature/postgres-and-auth` | 3001 |

Neither branch is merged into `main` yet. `main` still has the old single-page version.

## Set up on another device

1. Clone both repos side by side and check out the branches above.
2. `npm install` in each.
3. Create `.env.local` in each repo. Secrets are **not** in git; copy the values from the first device or from the dashboards. Variable names are in each repo's `.env.example`:
   - Both: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `REVALIDATE_SECRET` (must be the same value in both repos).
   - Storefront only: `NEXT_PUBLIC_SITE_URL`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX=true`.
   - Admin only: `STOREFRONT_URL=http://localhost:3000`.
4. `npm run dev` in each (storefront → 3000, admin → 3001).

The Supabase database is already set up and seeded; **do not** re-run anything to get started. `supabase/schema.sql` is safe to re-run if you ever need to (it is identical in both repos and must stay so).

Admin sign-in: the admin account already exists in Supabase Auth (role `admin` in `app_metadata`). If the password is lost, reset it from the Supabase dashboard (Authentication → Users). `npm run admin:create -- <email>` in the admin repo promotes another user.

## What exists

**Database (Supabase Postgres, live)**
- Tables with RLS: categories (tree via `parent_id`), products, coupons, orders, reviews, profiles, newsletter_subscribers, contact_messages.
- Functions (service role only): `place_order`, `set_order_status`, `mark_order_paid`, `mark_payment_failed`, `expire_stale_payments`.
- Auth: email + password, sign-up confirmed by a 6-digit code (10 min), Gmail SMTP, branded email templates (`supabase/email-templates/build.py`).
- Demo data: 9 parent + 27 subcategories, 58 products, 12 demo customers, 85 demo orders, 120 reviews, 7 coupons. `npm run db:seed-demo -- --reset` removes only the demo rows.

**Storefront**
- Catalog: home, `/shop` (URL-driven filters, sort, pagination), `/category/[slug]` (both levels), `/search`, `/deals`, `/product/[slug]` (gallery, tabs, reviews).
- Buying: `/cart`, `/checkout` (COD or SSLCommerz online payment, Bangladesh address picker), `/order/[id]` (token or owner only), `/track-order`.
- Account: login, register with OTP, password reset, `/account` sidebar dashboard (overview, orders, wishlist, reviews, profile, security, support).
- Info pages, sitemap, robots, JSON-LD, favicon.
- Custom UI kit in `src/components/ui/` and `src/components/store-ui/` (no native selects, checkboxes, radios, confirm dialogs), Framer Motion (`motion` package), shimmer skeletons.

**Admin panel**
- Sign-in required (admin role), own session cookie `fb-admin-auth`.
- Sidebar dashboard with a route per section: overview analytics, orders (+ detail), customers (+ detail), products (+ new/edit), categories (arrow tree, collapsed by default), coupons, reviews, messages, newsletter, settings.
- Saving catalog changes calls the storefront's `/api/revalidate` so the shop updates immediately.

## How well each part was checked

Verified in a real browser by the lead:
- COD order end to end (product → basket → checkout → order page → track order), before the address picker was added.
- Register with an already-used email shows "account already exists".
- Header account menu signed in and out.
- Shop filter sidebar has no horizontal scroll; subcategory page shows subcategory cards.
- Public key cannot read orders, coupons, profiles or call `place_order`.

Checked by the agent that built it (not re-checked by the lead):
- Account dashboard: all 7 pages rendered signed in at desktop and mobile widths.
- Address picker: one real COD order placed through checkout (Rajshahi → Bagha), then deleted.
- Demo data: every catalog image URL returns an image; order totals follow the pricing rules.

Only type-checked, linted and built — **nobody has looked at these on screen yet**:
- The whole rebuilt admin panel when signed in (only `/login` was seen). The alignment fixes requested from screenshots (KPI cards, "Orders by status" card, orders toolbar and table headers, bell badge, avatar initials) are in the code but unconfirmed.
- The storefront sweep (custom sort select, price slider, mobile filter sheet, pagination, product tabs, cart drawer, FAQ accordion, new skeletons).

Never tested:
- A full SSLCommerz sandbox payment (init call works; success/fail/cancel callbacks and IPN were only tested with fake data).
- Admin actions against real data after the rebuild (product save, bulk actions, status change, CSV export).
- Server rejection of an address whose upazila does not belong to the district.

## Delivery fee (decided 13 Nov 2026)

- Dhaka district: ৳60, free from ৳1000.
- Every other district: flat ৳130 courier fee, no free-delivery threshold.
- Orders with no district (older data) count as Dhaka.
- The rule lives in `place_order()` in `supabase/schema.sql` (source of truth, applied to the live DB and tested for both cases) and is mirrored for display in `src/lib/pricing.ts`. Change both together.
- Checkout recalculates the fee when the district changes (seen in a browser: Bogura → ৳130). The address picker now lists every district even after one is chosen; that last fix was type-checked and linted but not re-tested in a browser.

## Not done yet

Storefront
- Header search: keyboard shortcut hint and animated suggestions panel.
- Readable-typography pass is partial: home sections, `ProductCard`, category/deals/info pages, `Breadcrumbs`, `SectionHeader`, `EmptyState` still use light greys and 11–12px text.
- `/wishlist`, `/deals`, `/checkout`, `/order/[id]` and `/track-order` have no `loading.tsx`; while loading they show the root skeleton, which is shaped like the home page (wrong shape for them).
- Checkout still offers same-day slots to districts outside Dhaka (only the note text changes).
- `OtpVerifyForm` now uses the kit's `OtpInput`; forgot/reset password forms were not restyled.
- Forms are hand-validated; `react-hook-form`/`zod` were not adopted in the storefront.

Admin
- Signed-in visual audit at 1920, 1366 and 390 px.
- Dark mode.
- Some badges and help text are still 12px.
- Message read/unread is stored per browser (no DB column).
- The old unused `GET /api/store` is still there.

## Known issues

- `getCurrentUser()` called directly during render (e.g. `ReviewFormGate`, `/order/[id]`) logs a `Date.now()` prerender error in dev.
- Toasts can overlap the mobile bottom tab bar in the account area.
- Popups are absolutely positioned and can be clipped by an `overflow-hidden` ancestor.
- Rate limits are in memory: they reset on restart and are not shared between servers.
- `bangladesh-geo-data` says MIT but ships no LICENSE file and has one maintainer.

## Open decisions and security follow-ups

- **Rotate the Supabase secret key.** It was shared in a chat. Create a new one, update `.env.local` in both repos, then delete the old one.
- **Delete the Supabase personal access token** used for setup (Dashboard → Account → Access Tokens).
- **Delete `database.json` from the public `ecommerce-store` storage bucket.** It is the old data file with customer phone numbers and addresses and is still publicly readable. The app no longer uses it. A backup exists only on the first device at `grocery-store/.legacy/database.json` (git-ignored).
- Review the wording of the returns, privacy and terms pages before launch.
- Before production: set the real Site URL and redirect URLs in Supabase Auth, set `NEXT_PUBLIC_SITE_URL` to the public domain (SSLCommerz IPN cannot reach localhost), switch SSLCommerz to live credentials.
