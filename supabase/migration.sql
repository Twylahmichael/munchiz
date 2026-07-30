-- Munchiz Database Schema
-- Run this in Supabase SQL Editor to set up all tables, RLS, and seed data.

-- ============================================================
-- 1. TABLES
-- ============================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price int not null,  -- stored in KES whole units (not cents, since KES has no subunit in practice)
  photo_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  original_price int not null default 0,
  deal_price int not null,
  menu_item_ids uuid[] not null default '{}',
  photo_url text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  order_type text not null check (order_type in ('delivery', 'pickup')),
  location_notes text,
  items_summary jsonb not null default '[]',
  total_amount int not null,
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','completed','cancelled')),
  whatsapp_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  quantity int not null default 1,
  unit_price int not null,
  subtotal int not null
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Munchiz',
  whatsapp_number text not null default '254728466665',
  tagline text not null default 'Munch Together, Laugh Forever',
  logo_url text,
  operating_hours jsonb not null default '{"weekdays":"10:00 AM – 11:00 PM","weekends":"10:00 AM – 12:00 AM","note":"Late night vibes on weekends"}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_menu_items before update on public.menu_items
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_orders before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_site_settings before update on public.site_settings
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.deals enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;

-- Helper: check if user is admin (authenticated)
create or replace function public.is_admin()
returns boolean as $$
begin
  return (auth.role() = 'authenticated');
end;
$$ language plpgsql security definer;

-- Categories: public read, admin write
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_insert" on public.categories for insert with check (public.is_admin());
create policy "categories_admin_update" on public.categories for update using (public.is_admin());
create policy "categories_admin_delete" on public.categories for delete using (public.is_admin());

-- Menu Items: public read, admin write
create policy "menu_items_public_read" on public.menu_items for select using (true);
create policy "menu_items_admin_insert" on public.menu_items for insert with check (public.is_admin());
create policy "menu_items_admin_update" on public.menu_items for update using (public.is_admin());
create policy "menu_items_admin_delete" on public.menu_items for delete using (public.is_admin());

-- Deals: public read, admin write
create policy "deals_public_read" on public.deals for select using (true);
create policy "deals_admin_insert" on public.deals for insert with check (public.is_admin());
create policy "deals_admin_update" on public.deals for update using (public.is_admin());
create policy "deals_admin_delete" on public.deals for delete using (public.is_admin());

-- Orders: public insert only, admin full access
create policy "orders_public_insert" on public.orders for insert with check (true);
create policy "orders_admin_select" on public.orders for select using (public.is_admin());
create policy "orders_admin_update" on public.orders for update using (public.is_admin());
create policy "orders_admin_delete" on public.orders for delete using (public.is_admin());

-- Order Items: public insert only, admin full access
create policy "order_items_public_insert" on public.order_items for insert with check (true);
create policy "order_items_admin_select" on public.order_items for select using (public.is_admin());
create policy "order_items_admin_update" on public.order_items for update using (public.is_admin());
create policy "order_items_admin_delete" on public.order_items for delete using (public.is_admin());

-- Site Settings: public read, admin write
create policy "site_settings_public_read" on public.site_settings for select using (true);
create policy "site_settings_admin_insert" on public.site_settings for insert with check (public.is_admin());
create policy "site_settings_admin_update" on public.site_settings for update using (public.is_admin());
create policy "site_settings_admin_delete" on public.site_settings for delete using (public.is_admin());

-- ============================================================
-- 3. STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

create policy "menu_photos_public_read" on storage.objects for select using (bucket_id = 'menu-photos');
create policy "menu_photos_admin_insert" on storage.objects for insert with check (bucket_id = 'menu-photos' and public.is_admin());
create policy "menu_photos_admin_update" on storage.objects for update using (bucket_id = 'menu-photos' and public.is_admin());
create policy "menu_photos_admin_delete" on storage.objects for delete using (bucket_id = 'menu-photos' and public.is_admin());

-- ============================================================
-- 4. SEED DATA
-- ============================================================

-- Categories
insert into public.categories (id, name, slug, sort_order, icon) values
  ('a1000000-0000-0000-0000-000000000001', 'Burgers', 'burgers', 1, '🍔'),
  ('a1000000-0000-0000-0000-000000000002', 'Pizza', 'pizza', 2, '🍕'),
  ('a1000000-0000-0000-0000-000000000003', 'Fries', 'fries', 3, '🍟'),
  ('a1000000-0000-0000-0000-000000000004', 'Chicken', 'chicken', 4, '🍗'),
  ('a1000000-0000-0000-0000-000000000005', 'Drinks', 'drinks', 5, '🥤')
on conflict (id) do nothing;

-- Menu Items (prices in KES whole units)
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Munchiz Classic Burger', 'Juicy beef patty, melted cheese, fresh lettuce & our secret sauce.', 450, true, 1),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Meat Lovers Pizza', 'Loaded with beef, sausage, pepperoni & extra mozzarella.', 1200, true, 1),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Crispy Fries Bucket', 'Golden, salted, perfectly crispy. Comes with ketchup & mayo.', 200, true, 1),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Two Piece Chicken', 'Two pieces of crunchy fried chicken, marinated to perfection.', 380, true, 1),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', 'Saucy Chicken Wings', '6 pieces tossed in sweet & spicy sauce. Lick-your-fingers good.', 550, true, 2),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'Cold Sodas & Shakes', 'Ice-cold sodas, fresh juices & creamy milkshakes.', 150, true, 1)
on conflict (id) do nothing;

-- Deals
insert into public.deals (id, title, description, original_price, deal_price, is_active) values
  ('c1000000-0000-0000-0000-000000000001', 'Two Piece Thursdayz', '2pc chicken + fries + soda. The plug.', 730, 550, true),
  ('c1000000-0000-0000-0000-000000000002', 'Meat Lovers Pizza', 'Large pizza loaded with all the meats. Free soda.', 1350, 1200, true),
  ('c1000000-0000-0000-0000-000000000003', 'Burger + Fries Combo', 'Classic burger, fries & a cold drink. Hits every time.', 800, 700, true)
on conflict (id) do nothing;

-- Site Settings (single row)
insert into public.site_settings (id, business_name, whatsapp_number, tagline, operating_hours) values
  ('d1000000-0000-0000-0000-000000000001', 'Munchiz', '254728466665', 'Munch Together, Laugh Forever', '{"weekdays":"10:00 AM – 11:00 PM","weekends":"10:00 AM – 12:00 AM","note":"Late night vibes on weekends"}')
on conflict (id) do nothing;
