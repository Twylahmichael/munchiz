-- ============================================================
-- Munchiz — Generic Add-ons system
--
-- Replaces the previous hard-coded "tomato sachet" and "drink
-- add-on" logic with a data-driven model the admin can extend.
--
-- Model:
--   addon_categories   — logical grouping shown as sections in the
--                        "Add to cart" modal (e.g. "Sauces",
--                        "Drinks", "Extras").
--   addons             — an add-on line-item with name/price, in
--                        one category.
--   menu_item_addons   — many-to-many attaching add-ons to specific
--                        menu items. An item with zero attached
--                        add-ons just skips the modal.
--
-- Row-level security mirrors menu_items/categories: everyone can
-- read active rows; only authenticated admins can write.
-- Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------
create table if not exists public.addon_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.addons (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.addon_categories(id) on delete restrict,
  name         text not null,
  description  text not null default '',
  price        int  not null default 0,
  is_active    boolean not null default true,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists addons_category_id_idx on public.addons (category_id);

create table if not exists public.menu_item_addons (
  menu_item_id  uuid not null references public.menu_items(id) on delete cascade,
  addon_id      uuid not null references public.addons(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (menu_item_id, addon_id)
);

create index if not exists menu_item_addons_addon_id_idx on public.menu_item_addons (addon_id);

-- ------------------------------------------------------------
-- 2. RLS
-- ------------------------------------------------------------
alter table public.addon_categories enable row level security;
alter table public.addons           enable row level security;
alter table public.menu_item_addons enable row level security;

-- Read policies (everyone, incl. anon) — only active rows for addon_categories & addons.
drop policy if exists "addon_categories read" on public.addon_categories;
create policy "addon_categories read" on public.addon_categories
  for select using (is_active = true);

drop policy if exists "addons read" on public.addons;
create policy "addons read" on public.addons
  for select using (is_active = true);

drop policy if exists "menu_item_addons read" on public.menu_item_addons;
create policy "menu_item_addons read" on public.menu_item_addons
  for select using (true);

-- Write policies — authenticated admin users only.
-- Follows the same pattern as menu_items (assumes profiles.role='admin').
drop policy if exists "addon_categories admin write" on public.addon_categories;
create policy "addon_categories admin write" on public.addon_categories
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "addons admin write" on public.addons;
create policy "addons admin write" on public.addons
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "menu_item_addons admin write" on public.menu_item_addons;
create policy "menu_item_addons admin write" on public.menu_item_addons
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ------------------------------------------------------------
-- 3. updated_at triggers (reuse existing function if present)
-- ------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists addon_categories_touch on public.addon_categories;
create trigger addon_categories_touch
  before update on public.addon_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists addons_touch on public.addons;
create trigger addons_touch
  before update on public.addons
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 4. SEED — one demo category + one demo add-on so the modal
--    isn't empty on first admin view. Delete/replace freely.
-- ------------------------------------------------------------
insert into public.addon_categories (id, name, slug, sort_order, is_active) values
  ('e1000000-0000-0000-0000-000000000001', 'Sauces & Sachets', 'sauces-sachets', 1, true)
on conflict (slug) do nothing;

insert into public.addons (id, category_id, name, description, price, is_active, sort_order) values
  ('f1000000-0000-0000-0000-000000000001',
   'e1000000-0000-0000-0000-000000000001',
   'Tomato paste sachet',
   'A single sachet of tomato paste.',
   5, true, 1)
on conflict (id) do nothing;
