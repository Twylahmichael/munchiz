# Munchiz — Backend Upgrade Plan

Turn the current static single-page site into a database-driven ordering site with an admin panel, keeping the existing bold red/gold/black branding and WhatsApp-based order confirmation flow.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud (managed Supabase + Auth + Storage). Public anon key stays client-side; service role key never touches frontend code.

Tables (all in `public`, RLS enabled, grants explicit):

- `categories` — id, name, slug, sort_order
- `menu_items` — id, category_id, name, description, price (KES, integer cents-safe), image_url, is_available, sort_order, created_at
- `deals` — id, title, subtitle, price, image_url, day_label, variant, starts_at (nullable), ends_at (nullable), is_active
- `orders` — id, customer_name, phone, fulfillment ('delivery'|'pickup'), location_notes, items (jsonb: `[{item_id,name,qty,price}]`), subtotal, status ('pending'|'confirmed'|'completed'), created_at
- `user_roles` — id, user_id, role ('admin') — separate table, `has_role()` security-definer function (per user-roles knowledge)

Storage bucket `menu-images` (public) for item/deal photos, admin-only write policy.

RLS:
- `categories`, `menu_items` (available only), `deals` (active + within window): `SELECT` to `anon` + `authenticated`
- `menu_items`, `deals`, `categories`: full CRUD to admins via `has_role(auth.uid(),'admin')`
- `orders`: `INSERT` to `anon` (with input length/shape check via trigger), `SELECT`/`UPDATE` to admins only
- Insert trigger enforces: name 1–80 chars, phone regex, notes ≤500, items array 1–50, strips control chars — server-side validation so client can't bypass

Rate limiting: a lightweight `order_rate_limit` table keyed by phone + minute bucket, checked in a `BEFORE INSERT` trigger (max 3 orders / 5 min per phone). No edge function needed.

## 2. Frontend routes (TanStack Router)

- `/` — landing: hero + featured items (menu_items flagged / top 3) + active deals, pulled via server fn + TanStack Query
- `/menu` — full menu grouped by category, "Add to cart" buttons
- `/deals` — active deals grid (existing look)
- `/cart` — line items, qty +/-, subtotal, "Proceed to checkout"
- `/checkout` — form (zod-validated: name, phone, delivery/pickup, notes) → inserts order row → opens `wa.me/254728466665` with formatted summary in a new tab → clears cart → shows confirmation
- `/auth` — admin sign-in (email + password)
- `/_authenticated/admin` — dashboard: orders today, est. revenue, top items
- `/_authenticated/admin/menu` — CRUD menu items (with image upload to storage)
- `/_authenticated/admin/deals` — CRUD deals with schedule
- `/_authenticated/admin/orders` — list + status transitions

Cart state: `zustand` + `localStorage` persistence. No inline handlers, no `dangerouslySetInnerHTML`.

Existing components (`Menu.tsx`, `Deals.tsx`, `Hero.tsx`, `Navbar.tsx`, `FloatingWhatsApp.tsx`) get rewired to consume DB data and cart actions; branding, layout, and tokens preserved.

## 3. WhatsApp order flow

On checkout submit:
1. Zod-validate form.
2. Insert `orders` row (status `pending`) via server fn.
3. Build message:
   ```
   Hi Munchiz! 🍔 New order:
   • 2× Munchiz Classic Burger — KES 900
   • 1× Meat Lovers Pizza — KES 1,200
   Subtotal: KES 2,100
   Name: Jane • Phone: 0712…
   Delivery to: Kamulu, near…
   Order #A1B2
   ```
4. `window.open(wa.me/254728466665?text=…)` — same UX as today, dynamic content.

## 4. Seed data

Migration seeds categories + current 6 menu items + current 3 deals (using existing asset URLs) so the site looks identical on first load.

## 5. Security checklist

- RLS on every table, explicit `GRANT`s
- Roles in `user_roles` + `has_role()` — never on profile
- Zod validation client-side + Postgres trigger server-side
- Rate-limit trigger on orders
- Admin bootstrap: first admin promoted by running a one-off SQL snippet (documented) after their first signup — no self-serve admin
- All secrets via env; only `VITE_SUPABASE_*` in client
- No `dangerouslySetInnerHTML`, no inline `on*=` strings

## Technical notes

- Server fns: `listMenu`, `listDeals`, `createOrder` (public, publishable-key client); admin CRUD via authenticated fns using `requireSupabaseAuth` + `has_role` check.
- Admin image upload: signed upload directly to `menu-images` bucket from admin UI.
- Migration includes: enum `app_role`, `has_role()`, all tables + GRANTs + RLS + policies + validation/rate-limit triggers + seeds.
- Deal visibility: view `active_deals` filtering by `is_active AND (starts_at IS NULL OR now() >= starts_at) AND (ends_at IS NULL OR now() < ends_at)`.

Approve and I'll enable Cloud, run the migration, and wire it up.
