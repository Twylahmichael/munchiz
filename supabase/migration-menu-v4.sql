-- ============================================================
-- Munchiz — Menu v4: drinks refresh
-- Replaces the generic "small/medium/big/mega juice" placeholders
-- with the real drinks menu:
--
--   Fresh juices : Fruit juice, Pineapple mint, Sugarcane lime,
--                  Hibiscus juice.
--   Sodas 350ml  : Coke, Sprite, Fanta Orange, Fanta Blackcurrant
--                  (50 KES each).
--   Bottled      : Coca-Cola take-away (50), Water 500ml (50),
--                  Predator (70), Coca-Cola 1.25L (150),
--                  Coca-Cola 2L (200).
--
-- Prices marked (assumed) below were not given on the source
-- list and default to Nairobi retail norms — adjust in
-- Admin → Meals if wrong. Idempotent, safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. RE-PURPOSE the four legacy juice IDs into the fresh juices.
--    Keeping the IDs preserves any existing favorites rows.
-- ------------------------------------------------------------
update public.menu_items
  set name = 'Fruit Juice',
      description = 'Freshly-blended seasonal fruit juice. Ask about today''s mix.',
      price = 100,
      sort_order = 1,
      photo_url = 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80&auto=format&fit=crop'
  where id = 'b2000000-0000-0000-0000-000000000601';

update public.menu_items
  set name = 'Pineapple Mint',
      description = 'Cold-pressed pineapple with fresh mint. Sweet, sharp, refreshing.',
      price = 100,
      sort_order = 2,
      photo_url = 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80&auto=format&fit=crop'
  where id = 'b2000000-0000-0000-0000-000000000602';

update public.menu_items
  set name = 'Sugarcane Lime',
      description = 'Fresh-pressed sugarcane with a squeeze of lime.',
      price = 100,
      sort_order = 3,
      photo_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop'
  where id = 'b2000000-0000-0000-0000-000000000603';

update public.menu_items
  set name = 'Hibiscus Juice',
      description = 'Chilled hibiscus (dawa/karkade). Tart, floral, deeply hydrating.',
      price = 100,
      sort_order = 4,
      photo_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80&auto=format&fit=crop'
  where id = 'b2000000-0000-0000-0000-000000000604';

-- ------------------------------------------------------------
-- 2. NEW SODA / BOTTLED DRINK ITEMS
-- ------------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000605', 'a1000000-0000-0000-0000-000000000005',
    'Coke 350ml',
    'Chilled Coca-Cola, 350 ml bottle.',
    50, true, 10),
  ('b2000000-0000-0000-0000-000000000606', 'a1000000-0000-0000-0000-000000000005',
    'Sprite 350ml',
    'Chilled Sprite, 350 ml bottle.',
    50, true, 11),
  ('b2000000-0000-0000-0000-000000000607', 'a1000000-0000-0000-0000-000000000005',
    'Fanta Orange 350ml',
    'Chilled Fanta Orange, 350 ml bottle.',
    50, true, 12),
  ('b2000000-0000-0000-0000-000000000608', 'a1000000-0000-0000-0000-000000000005',
    'Fanta Blackcurrant 350ml',
    'Chilled Fanta Blackcurrant, 350 ml bottle.',
    50, true, 13),
  ('b2000000-0000-0000-0000-000000000609', 'a1000000-0000-0000-0000-000000000005',
    'Coca-Cola Take Away',
    'Personal take-away Coca-Cola.',
    50, true, 14),
  ('b2000000-0000-0000-0000-000000000610', 'a1000000-0000-0000-0000-000000000005',
    'Water 500ml',
    'Bottled drinking water, 500 ml.',
    50, true, 15),
  ('b2000000-0000-0000-0000-000000000611', 'a1000000-0000-0000-0000-000000000005',
    'Predator',
    'Predator energy drink.',
    70, true, 16),
  ('b2000000-0000-0000-0000-000000000612', 'a1000000-0000-0000-0000-000000000005',
    'Coca-Cola 1.25L',
    'Shareable 1.25L bottle of Coca-Cola.',
    150, true, 17),
  ('b2000000-0000-0000-0000-000000000613', 'a1000000-0000-0000-0000-000000000005',
    'Coca-Cola 2L',
    'Family-size 2L bottle of Coca-Cola.',
    200, true, 18)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Photos for the sodas.
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000605';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000606';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000607';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000608';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000609';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1560847468-5eef16e29b95?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000610';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000611';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000612';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000613';
