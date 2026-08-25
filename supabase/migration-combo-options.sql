-- Migration: Combo option selection + included drink choice
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Structured combo data on menu_items
-- ============================================================

alter table public.menu_items
  add column if not exists combo_options jsonb not null default '[]',
  add column if not exists drink_choice_count int not null default 0;

comment on column public.menu_items.combo_options is
  'Optional array of exactly 2 {"label","items":[...]} objects for combos with two selectable variants (e.g. "burger" OR "nuggets"). Empty array = single fixed combo / not a combo.';
comment on column public.menu_items.drink_choice_count is
  'How many drinks (from the Drinks add-on list) are included free with this item. 0 = no drink picker shown.';

-- ============================================================
-- 2. Backfill the combo items currently on the menu, parsed
--    from their existing "...\nOR\n..." description text.
-- ============================================================

update public.menu_items set
  combo_options = '[
    {"label": "Burger", "items": ["1 beef burger / chicken burger", "1 medium fries", "1 small teriyaki or ranch sauce"]},
    {"label": "Chicken Nuggets", "items": ["Chicken nuggets", "1 medium fries", "1 small ranch or teriyaki sauce"]}
  ]'::jsonb,
  drink_choice_count = 1
where id = 'b2000000-0000-0000-0000-000000000101'; -- Solo Date Combo

update public.menu_items set
  combo_options = '[
    {"label": "Pizza", "items": ["2 small classic pizzas", "1 medium fries", "1 small teriyaki and ranch sauce"]},
    {"label": "Burgers", "items": ["1 cheese beef burger", "1 cheese chicken burger", "1 small ranch and teriyaki sauce", "1 medium fries"]}
  ]'::jsonb,
  drink_choice_count = 2
where id = 'b2000000-0000-0000-0000-000000000102'; -- Besties Combo

update public.menu_items set
  combo_options = '[
    {"label": "Pizza & Burgers", "items": ["1 medium classic pizza", "2 chicken burgers", "1 large fries", "1 large ranch and teriyaki sauce"]},
    {"label": "Double Pizza & Nuggets", "items": ["2 medium pizzas", "Chicken nuggets", "1 large fries", "1 large ranch and teriyaki sauce"]}
  ]'::jsonb,
  drink_choice_count = 1
where id = 'b2000000-0000-0000-0000-000000000103'; -- Mbogi Combo

update public.menu_items set
  combo_options = '[
    {"label": "Pizza & Burgers", "items": ["1 extra large pizza", "2 cheese chicken / cheese beef burgers", "Family size fries", "1 large ranch and teriyaki sauce"]},
    {"label": "Double Pizza & Nuggets", "items": ["2 large pizzas", "2 chicken nuggets", "Family size fries", "1 large ranch and teriyaki sauce"]}
  ]'::jsonb,
  drink_choice_count = 1
where id = 'b2000000-0000-0000-0000-000000000104'; -- Mega Family Combo

update public.menu_items set
  combo_options = '[]'::jsonb,
  drink_choice_count = 1
where id = 'b2000000-0000-0000-0000-000000000111'; -- Family Bucket Combo (single option, still includes a soda)

-- Sausage Combo, Smokie Combo, Smokie Sausage Combo, Smokie Samosa Combo,
-- Sausage Samosa Combo, Samosa Combo: no drink included, no two-way choice
-- — left at the column defaults (combo_options '[]', drink_choice_count 0).
