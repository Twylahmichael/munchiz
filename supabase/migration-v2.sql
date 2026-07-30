-- ============================================================
-- MUNCHIZ V2 — Full Database Schema
-- Run this in Supabase SQL Editor AFTER the V1 migration.
-- It adds new tables and alters existing ones for the full-stack platform.
-- ============================================================

-- ============================================================
-- 0. HELPER FUNCTIONS
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Admin check: verifies user has role='admin' AND is_approved=true in profiles
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_approved = true
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  is_approved boolean not null default true,
  default_delivery_address text,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    'customer',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. ALTER EXISTING TABLES FOR V2
-- ============================================================

-- categories: add is_active
alter table public.categories add column if not exists is_active boolean not null default true;
alter table public.categories add column if not exists updated_at timestamptz not null default now();
drop trigger if exists set_updated_at_categories on public.categories;
create trigger set_updated_at_categories before update on public.categories
  for each row execute function public.handle_updated_at();

-- menu_items: add favorites_count
alter table public.menu_items add column if not exists favorites_count integer not null default 0;

-- orders: add new columns for V2
alter table public.orders add column if not exists user_id uuid references public.profiles(id);
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists delivery_notes text;
alter table public.orders add column if not exists subtotal integer not null default 0;
alter table public.orders add column if not exists delivery_fee integer not null default 0;
alter table public.orders add column if not exists payment_method text not null default 'cash' check (payment_method in ('cash', 'mpesa'));
alter table public.orders add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed'));
alter table public.orders add column if not exists assigned_driver_id uuid;

-- Update orders status check to include 'on_the_way'
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'preparing', 'on_the_way', 'completed', 'cancelled'));

-- order_items: add item_name snapshot and created_at
alter table public.order_items add column if not exists item_name text not null default '';
alter table public.order_items add column if not exists created_at timestamptz not null default now();

-- deals: add updated_at
alter table public.deals add column if not exists updated_at timestamptz not null default now();
drop trigger if exists set_updated_at_deals on public.deals;
create trigger set_updated_at_deals before update on public.deals
  for each row execute function public.handle_updated_at();

-- site_settings: add new fields
alter table public.site_settings add column if not exists phone_number text not null default '0728466665';
alter table public.site_settings add column if not exists location_text text not null default 'Kamulu, Kanisani — off Kangundo Road, Nairobi, Kenya';
alter table public.site_settings add column if not exists google_maps_embed_url text;
alter table public.site_settings add column if not exists tiktok_handle text;
alter table public.site_settings add column if not exists instagram_handle text;
alter table public.site_settings add column if not exists delivery_fee integer not null default 0;
alter table public.site_settings add column if not exists minimum_order_amount integer not null default 0;

-- ============================================================
-- 3. NEW TABLES
-- ============================================================

-- Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, menu_item_id)
);

-- Vendors
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_phone text not null default '',
  contact_email text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_vendors before update on public.vendors
  for each row execute function public.handle_updated_at();

-- Drivers
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  name text not null,
  phone text not null default '',
  is_active boolean not null default true,
  current_status text not null default 'offline' check (current_status in ('available', 'on_delivery', 'offline')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_drivers before update on public.drivers
  for each row execute function public.handle_updated_at();

-- Add FK for assigned_driver_id on orders
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_assigned_driver_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_assigned_driver_id_fkey
      foreign key (assigned_driver_id) references public.drivers(id);
  end if;
end $$;

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount integer not null,
  category text not null default 'other',
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_expenses before update on public.expenses
  for each row execute function public.handle_updated_at();

-- Promos
create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null,
  min_order_amount integer not null default 0,
  max_uses integer,
  times_used integer not null default 0,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_promos before update on public.promos
  for each row execute function public.handle_updated_at();

-- Flash Sales
create table if not exists public.flash_sales (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  flash_price integer not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  max_quantity integer,
  sold_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_flash_sales before update on public.flash_sales
  for each row execute function public.handle_updated_at();

-- Bundles
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  menu_item_ids uuid[] not null default '{}',
  bundle_price integer not null,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_bundles before update on public.bundles
  for each row execute function public.handle_updated_at();

-- Campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('push_notification', 'sms', 'email', 'in_app')),
  message text not null default '',
  target_audience text not null default 'all' check (target_audience in ('all', 'new_customers', 'returning', 'inactive')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_campaigns before update on public.campaigns
  for each row execute function public.handle_updated_at();

-- Rewards
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  points integer not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_rewards before update on public.rewards
  for each row execute function public.handle_updated_at();

-- Customer Leads
create table if not exists public.customer_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  email text,
  source text not null default 'website' check (source in ('walk_in', 'social_media', 'referral', 'website', 'other')),
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_customer_leads before update on public.customer_leads
  for each row execute function public.handle_updated_at();

-- Support Tickets
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  order_id uuid references public.orders(id),
  subject text not null,
  message text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_support_tickets before update on public.support_tickets
  for each row execute function public.handle_updated_at();

-- Zones
create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  delivery_fee integer not null default 0,
  estimated_time_minutes integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_zones before update on public.zones
  for each row execute function public.handle_updated_at();

-- Branches
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  phone text not null default '',
  operating_hours jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at_branches before update on public.branches
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all new tables
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.vendors enable row level security;
alter table public.drivers enable row level security;
alter table public.expenses enable row level security;
alter table public.promos enable row level security;
alter table public.flash_sales enable row level security;
alter table public.bundles enable row level security;
alter table public.campaigns enable row level security;
alter table public.rewards enable row level security;
alter table public.customer_leads enable row level security;
alter table public.support_tickets enable row level security;
alter table public.zones enable row level security;
alter table public.branches enable row level security;

-- Drop old RLS policies that are too permissive
drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "order_items_public_insert" on public.order_items;

-- ---- PROFILES ----
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin());
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin());

-- ---- CATEGORIES (update existing) ----
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (is_active = true);
create policy "categories_admin_read_all" on public.categories
  for select using (public.is_admin());

-- ---- MENU ITEMS (keep existing, they allow public read) ----

-- ---- DEALS ----
drop policy if exists "deals_public_read" on public.deals;
create policy "deals_public_read" on public.deals
  for select using (
    is_active = true
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );
create policy "deals_admin_read_all" on public.deals
  for select using (public.is_admin());

-- ---- ORDERS (authenticated customers: insert own, select own) ----
create policy "orders_auth_insert" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_auth_select_own" on public.orders
  for select using (auth.uid() = user_id);
-- Keep admin policies (already exist from V1)

-- ---- ORDER ITEMS (auth insert with own order, select where order is own) ----
create policy "order_items_auth_insert" on public.order_items
  for insert with check (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );
create policy "order_items_auth_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

-- ---- FAVORITES ----
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);
create policy "favorites_admin_all" on public.favorites
  for all using (public.is_admin());

-- ---- FLASH SALES (public read active ones) ----
create policy "flash_sales_public_read" on public.flash_sales
  for select using (is_active = true and start_time <= now() and end_time >= now());
create policy "flash_sales_admin_all" on public.flash_sales
  for all using (public.is_admin());

-- ---- BUNDLES (public read active) ----
create policy "bundles_public_read" on public.bundles
  for select using (is_active = true);
create policy "bundles_admin_all" on public.bundles
  for all using (public.is_admin());

-- ---- ZONES (public read active) ----
create policy "zones_public_read" on public.zones
  for select using (is_active = true);
create policy "zones_admin_all" on public.zones
  for all using (public.is_admin());

-- ---- BRANCHES (public read active) ----
create policy "branches_public_read" on public.branches
  for select using (is_active = true);
create policy "branches_admin_all" on public.branches
  for all using (public.is_admin());

-- ---- PROMOS (public read active for validation) ----
create policy "promos_public_read" on public.promos
  for select using (is_active = true and start_date <= now() and end_date >= now());
create policy "promos_admin_all" on public.promos
  for all using (public.is_admin());

-- ---- REWARDS (auth: select own) ----
create policy "rewards_select_own" on public.rewards
  for select using (auth.uid() = user_id);
create policy "rewards_admin_all" on public.rewards
  for all using (public.is_admin());

-- ---- SUPPORT TICKETS (auth: insert own, select own) ----
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);
create policy "support_tickets_select_own" on public.support_tickets
  for select using (auth.uid() = user_id);
create policy "support_tickets_admin_all" on public.support_tickets
  for all using (public.is_admin());

-- ---- ADMIN-ONLY TABLES ----
create policy "vendors_admin_all" on public.vendors
  for all using (public.is_admin());
create policy "drivers_admin_all" on public.drivers
  for all using (public.is_admin());
create policy "expenses_admin_all" on public.expenses
  for all using (public.is_admin());
create policy "campaigns_admin_all" on public.campaigns
  for all using (public.is_admin());
create policy "customer_leads_admin_all" on public.customer_leads
  for all using (public.is_admin());

-- ============================================================
-- 5. STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('menu-images', 'menu-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('branding', 'branding', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Storage policies: menu-images
create policy "menu_images_public_read" on storage.objects
  for select using (bucket_id = 'menu-images');
create policy "menu_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'menu-images' and public.is_admin());
create policy "menu_images_admin_update" on storage.objects
  for update using (bucket_id = 'menu-images' and public.is_admin());
create policy "menu_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'menu-images' and public.is_admin());

-- Storage policies: branding
create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');
create policy "branding_admin_insert" on storage.objects
  for insert with check (bucket_id = 'branding' and public.is_admin());
create policy "branding_admin_update" on storage.objects
  for update using (bucket_id = 'branding' and public.is_admin());
create policy "branding_admin_delete" on storage.objects
  for delete using (bucket_id = 'branding' and public.is_admin());

-- Storage policies: user-avatars (users upload to own folder)
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'user-avatars');
create policy "avatars_auth_insert" on storage.objects
  for insert with check (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars_auth_update" on storage.objects
  for update using (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 6. ENABLE REALTIME
-- ============================================================

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;

-- ============================================================
-- 7. SEED DATA (only if tables are empty)
-- ============================================================

-- Categories: add Wings
insert into public.categories (id, name, slug, sort_order, icon, is_active) values
  ('a1000000-0000-0000-0000-000000000006', 'Wings', 'wings', 6, '🍗', true)
on conflict (id) do nothing;

-- Update site_settings with new fields
update public.site_settings
set
  phone_number = '0728466665',
  location_text = 'Kamulu, Kanisani — off Kangundo Road, Nairobi, Kenya',
  tiktok_handle = '@MUNCHIZ1',
  delivery_fee = 0,
  minimum_order_amount = 0
where id = 'd1000000-0000-0000-0000-000000000001';

-- Seed zones
insert into public.zones (id, name, delivery_fee, estimated_time_minutes, is_active) values
  ('e1000000-0000-0000-0000-000000000001', 'Kamulu Centre', 0, 15, true),
  ('e1000000-0000-0000-0000-000000000002', 'Kangundo Road', 5000, 25, true),
  ('e1000000-0000-0000-0000-000000000003', 'Joska', 10000, 35, true),
  ('e1000000-0000-0000-0000-000000000004', 'Ruai', 15000, 45, true)
on conflict (id) do nothing;

-- Seed branch
insert into public.branches (id, name, address, phone, operating_hours, is_active) values
  ('f1000000-0000-0000-0000-000000000001', 'Munchiz Kamulu', 'Kanisani, off Kangundo Road, Kamulu', '0728466665',
   '{"weekdays":"10:00 AM – 11:00 PM","weekends":"10:00 AM – 12:00 AM","note":"Late night vibes on weekends"}', true)
on conflict (id) do nothing;
