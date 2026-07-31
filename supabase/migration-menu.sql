-- ============================================================
-- Munchiz — Menu + Site Settings refresh
-- Idempotent: safe to re-run. Replaces the placeholder seed menu
-- with the real Munchiz menu from the handwritten notes.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SITE SETTINGS
-- ------------------------------------------------------------
insert into public.site_settings (id, business_name, whatsapp_number, phone_number, tagline, operating_hours, location_text, google_maps_embed_url)
values (
  'd1000000-0000-0000-0000-000000000001',
  'Munchiz',
  '254728466665',
  '0728466665',
  'Bites of Happiness',
  '{"weekdays":"9:00 AM – 9:00 PM","weekends":"9:00 AM – 9:00 PM","note":"Open every day"}'::jsonb,
  'Kanisani Road, Nairobi 63665, KE',
  'https://www.google.com/maps?q=Kanisani+Road+Nairobi&output=embed'
)
on conflict (id) do update set
  business_name = excluded.business_name,
  whatsapp_number = excluded.whatsapp_number,
  phone_number = excluded.phone_number,
  tagline = excluded.tagline,
  operating_hours = excluded.operating_hours,
  location_text = excluded.location_text,
  google_maps_embed_url = excluded.google_maps_embed_url;

-- ------------------------------------------------------------
-- 2. REMOVE OLD PLACEHOLDER SEED ITEMS
-- ------------------------------------------------------------
delete from public.menu_items where id in (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000006'
);

delete from public.deals where id in (
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003'
);

-- ------------------------------------------------------------
-- 3. CATEGORIES
-- ------------------------------------------------------------
-- Reuse existing ids where possible; rename Fries → Sides.
insert into public.categories (id, name, slug, sort_order, icon, is_active) values
  ('a2000000-0000-0000-0000-000000000001', 'Combos',   'combos',   1, '🎁', true),
  ('a1000000-0000-0000-0000-000000000002', 'Pizza',    'pizza',    2, '🍕', true),
  ('a1000000-0000-0000-0000-000000000001', 'Burgers',  'burgers',  3, '🍔', true),
  ('a1000000-0000-0000-0000-000000000004', 'Chicken',  'chicken',  4, '🍗', true),
  ('a1000000-0000-0000-0000-000000000003', 'Sides',    'sides',    5, '🍟', true),
  ('a1000000-0000-0000-0000-000000000005', 'Drinks',   'drinks',   6, '🥤', true),
  ('a2000000-0000-0000-0000-000000000002', 'Sauces',   'sauces',   7, '🥫', true),
  ('a2000000-0000-0000-0000-000000000003', 'Kiddies',  'kiddies',  8, '🧒', true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  icon = excluded.icon,
  is_active = excluded.is_active;

-- ------------------------------------------------------------
-- 4. MENU ITEMS
-- ------------------------------------------------------------

-- Combos --------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000101', 'a2000000-0000-0000-0000-000000000001',
    'Solo Date Combo',
    '1 cheesy beef or chicken burger, medium juice, chips & a ranch or teriyaki sauce. Perfect for a night in.',
    500, true, 1),
  ('b2000000-0000-0000-0000-000000000102', 'a2000000-0000-0000-0000-000000000001',
    'Besties Combo',
    'Choose 2 small pizzas OR 2 cheesy burgers, 2 juices, chips and sauces. Made for two.',
    1000, true, 2),
  ('b2000000-0000-0000-0000-000000000103', 'a2000000-0000-0000-0000-000000000001',
    'Mbagi Combo',
    '1 medium pizza (or 2 mediums), 2 chicken burgers (or nuggets), mega juice, chips & sauces. Big vibes.',
    1500, true, 3),
  ('b2000000-0000-0000-0000-000000000104', 'a2000000-0000-0000-0000-000000000001',
    'Mega Family Combo',
    '1 large pizza (or 2 larges), 2 cheesy burgers (or nuggets), mega juice, 2 chips & sauces. Feeds the crew.',
    2000, true, 4),
  ('b2000000-0000-0000-0000-000000000105', 'a2000000-0000-0000-0000-000000000001',
    'Sausage Combo',
    'Sausage, chips & a cold drink. Quick fix, big flavour.',
    150, true, 5),
  ('b2000000-0000-0000-0000-000000000106', 'a2000000-0000-0000-0000-000000000001',
    'Smokie Sausage Combo',
    'Smokie + sausage combo with chips. Double up the vibes.',
    140, true, 6),
  ('b2000000-0000-0000-0000-000000000107', 'a2000000-0000-0000-0000-000000000001',
    'Smokie Combo',
    'Grilled smokie with chips & sauce.',
    130, true, 7),
  ('b2000000-0000-0000-0000-000000000108', 'a2000000-0000-0000-0000-000000000001',
    'Smokie Samosa Combo',
    'Smokie, samosa and chips. Street food royalty.',
    120, true, 8),
  ('b2000000-0000-0000-0000-000000000109', 'a2000000-0000-0000-0000-000000000001',
    'Sausage Samosa Combo',
    'Sausage, samosa & chips. Crunchy, savoury, satisfying.',
    130, true, 9),
  ('b2000000-0000-0000-0000-000000000110', 'a2000000-0000-0000-0000-000000000001',
    'Samosa Combo',
    'Samosa with chips & sauce. Simple. Solid.',
    100, true, 10)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Pizza — Classic (BBQ Beef / BBQ Chicken / Margherita) --------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000201', 'a1000000-0000-0000-0000-000000000002', 'BBQ Beef Pizza (Small)',       'Classic pizza topped with smoky BBQ beef and mozzarella.', 550, true, 1),
  ('b2000000-0000-0000-0000-000000000202', 'a1000000-0000-0000-0000-000000000002', 'BBQ Beef Pizza (Medium)',      'Classic pizza topped with smoky BBQ beef and mozzarella.', 700, true, 2),
  ('b2000000-0000-0000-0000-000000000203', 'a1000000-0000-0000-0000-000000000002', 'BBQ Beef Pizza (Large)',       'Classic pizza topped with smoky BBQ beef and mozzarella.', 900, true, 3),
  ('b2000000-0000-0000-0000-000000000204', 'a1000000-0000-0000-0000-000000000002', 'BBQ Beef Pizza (Extra Large)', 'Classic pizza topped with smoky BBQ beef and mozzarella.', 1500, true, 4),

  ('b2000000-0000-0000-0000-000000000211', 'a1000000-0000-0000-0000-000000000002', 'BBQ Chicken Pizza (Small)',       'Classic pizza with tangy BBQ chicken and melted mozzarella.', 550, true, 5),
  ('b2000000-0000-0000-0000-000000000212', 'a1000000-0000-0000-0000-000000000002', 'BBQ Chicken Pizza (Medium)',      'Classic pizza with tangy BBQ chicken and melted mozzarella.', 700, true, 6),
  ('b2000000-0000-0000-0000-000000000213', 'a1000000-0000-0000-0000-000000000002', 'BBQ Chicken Pizza (Large)',       'Classic pizza with tangy BBQ chicken and melted mozzarella.', 900, true, 7),
  ('b2000000-0000-0000-0000-000000000214', 'a1000000-0000-0000-0000-000000000002', 'BBQ Chicken Pizza (Extra Large)', 'Classic pizza with tangy BBQ chicken and melted mozzarella.', 1500, true, 8),

  ('b2000000-0000-0000-0000-000000000221', 'a1000000-0000-0000-0000-000000000002', 'Margherita Pizza (Small)',       'Fresh basil, tomato and generous mozzarella. The original.', 550, true, 9),
  ('b2000000-0000-0000-0000-000000000222', 'a1000000-0000-0000-0000-000000000002', 'Margherita Pizza (Medium)',      'Fresh basil, tomato and generous mozzarella. The original.', 700, true, 10),
  ('b2000000-0000-0000-0000-000000000223', 'a1000000-0000-0000-0000-000000000002', 'Margherita Pizza (Large)',       'Fresh basil, tomato and generous mozzarella. The original.', 900, true, 11),
  ('b2000000-0000-0000-0000-000000000224', 'a1000000-0000-0000-0000-000000000002', 'Margherita Pizza (Extra Large)', 'Fresh basil, tomato and generous mozzarella. The original.', 1500, true, 12),

  -- Deluxe (Pepperoni / Hawaiian) --
  ('b2000000-0000-0000-0000-000000000231', 'a1000000-0000-0000-0000-000000000002', 'Pepperoni Pizza (Small)',       'Deluxe pizza with spicy pepperoni layered on melted cheese.', 650, true, 13),
  ('b2000000-0000-0000-0000-000000000232', 'a1000000-0000-0000-0000-000000000002', 'Pepperoni Pizza (Medium)',      'Deluxe pizza with spicy pepperoni layered on melted cheese.', 850, true, 14),
  ('b2000000-0000-0000-0000-000000000233', 'a1000000-0000-0000-0000-000000000002', 'Pepperoni Pizza (Large)',       'Deluxe pizza with spicy pepperoni layered on melted cheese.', 1050, true, 15),
  ('b2000000-0000-0000-0000-000000000234', 'a1000000-0000-0000-0000-000000000002', 'Pepperoni Pizza (Extra Large)', 'Deluxe pizza with spicy pepperoni layered on melted cheese.', 1650, true, 16),

  ('b2000000-0000-0000-0000-000000000241', 'a1000000-0000-0000-0000-000000000002', 'Hawaiian Pizza (Small)',       'Deluxe pizza with ham, pineapple and mozzarella. Yes, pineapple.', 650, true, 17),
  ('b2000000-0000-0000-0000-000000000242', 'a1000000-0000-0000-0000-000000000002', 'Hawaiian Pizza (Medium)',      'Deluxe pizza with ham, pineapple and mozzarella. Yes, pineapple.', 850, true, 18),
  ('b2000000-0000-0000-0000-000000000243', 'a1000000-0000-0000-0000-000000000002', 'Hawaiian Pizza (Large)',       'Deluxe pizza with ham, pineapple and mozzarella. Yes, pineapple.', 1050, true, 19),
  ('b2000000-0000-0000-0000-000000000244', 'a1000000-0000-0000-0000-000000000002', 'Hawaiian Pizza (Extra Large)', 'Deluxe pizza with ham, pineapple and mozzarella. Yes, pineapple.', 1650, true, 20),

  -- Gourmet (Meat Lovers) --
  ('b2000000-0000-0000-0000-000000000251', 'a1000000-0000-0000-0000-000000000002', 'Meat Lovers Pizza (Small)',       'Gourmet pizza loaded with beef, chicken, sausage & extra cheese.', 700, true, 21),
  ('b2000000-0000-0000-0000-000000000252', 'a1000000-0000-0000-0000-000000000002', 'Meat Lovers Pizza (Medium)',      'Gourmet pizza loaded with beef, chicken, sausage & extra cheese.', 1100, true, 22),
  ('b2000000-0000-0000-0000-000000000253', 'a1000000-0000-0000-0000-000000000002', 'Meat Lovers Pizza (Large)',       'Gourmet pizza loaded with beef, chicken, sausage & extra cheese.', 1500, true, 23),
  ('b2000000-0000-0000-0000-000000000254', 'a1000000-0000-0000-0000-000000000002', 'Meat Lovers Pizza (Extra Large)', 'Gourmet pizza loaded with beef, chicken, sausage & extra cheese.', 1900, true, 24)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Burgers -------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000301', 'a1000000-0000-0000-0000-000000000001',
    'Cheesy Beef Burger',
    'Juicy beef patty, melted cheese, fresh lettuce and our secret sauce.',
    300, true, 1),
  ('b2000000-0000-0000-0000-000000000302', 'a1000000-0000-0000-0000-000000000001',
    'Cheesy Chicken Burger',
    'Crispy chicken fillet, melted cheese, lettuce and mayo. Chef''s kiss.',
    300, true, 2)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Chicken -------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000401', 'a1000000-0000-0000-0000-000000000004',
    'Chicken Nuggets',
    'Golden, crispy nuggets served with your choice of sauce.',
    200, true, 1),
  ('b2000000-0000-0000-0000-000000000402', 'a1000000-0000-0000-0000-000000000004',
    'Chicken Nuggets (Large)',
    'Bigger portion of our crispy chicken nuggets. Share or don''t.',
    250, true, 2)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Sides ---------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000501', 'a1000000-0000-0000-0000-000000000003',
    'Chips',
    'Golden, salted, perfectly crispy. Comes with ketchup.',
    100, true, 1),
  ('b2000000-0000-0000-0000-000000000502', 'a1000000-0000-0000-0000-000000000003',
    'Sausage',
    'Grilled sausage with a hint of spice.',
    50, true, 2)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Drinks (Juices) ----------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000601', 'a1000000-0000-0000-0000-000000000005',
    'Small Juice',
    'Freshly-blended fruit juice. Small cup, big flavour.',
    100, true, 1),
  ('b2000000-0000-0000-0000-000000000602', 'a1000000-0000-0000-0000-000000000005',
    'Medium Juice',
    'Freshly-blended fruit juice in a medium cup.',
    100, true, 2),
  ('b2000000-0000-0000-0000-000000000603', 'a1000000-0000-0000-0000-000000000005',
    'Big Juice',
    'A generous serving of fresh juice.',
    200, true, 3),
  ('b2000000-0000-0000-0000-000000000604', 'a1000000-0000-0000-0000-000000000005',
    'Mega Juice',
    'Our biggest juice. Bring a friend. Or don''t.',
    300, true, 4)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Sauces --------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000701', 'a2000000-0000-0000-0000-000000000002',
    'Ranch Sauce',
    'Cool, creamy ranch. Small serving.',
    30, true, 1),
  ('b2000000-0000-0000-0000-000000000702', 'a2000000-0000-0000-0000-000000000002',
    'Teriyaki Sauce',
    'Sweet-savoury teriyaki. Small serving.',
    30, true, 2),
  ('b2000000-0000-0000-0000-000000000703', 'a2000000-0000-0000-0000-000000000002',
    'Ranch Sauce (Large)',
    'Cool, creamy ranch. Bigger portion for the dippers.',
    60, true, 3),
  ('b2000000-0000-0000-0000-000000000704', 'a2000000-0000-0000-0000-000000000002',
    'Teriyaki Sauce (Large)',
    'Sweet-savoury teriyaki. Bigger portion for the dippers.',
    60, true, 4)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Kiddies -------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000801', 'a2000000-0000-0000-0000-000000000003',
    'Happy Meal',
    'Chicken nuggets, small juice, a sausage and ranch sauce. Little Munchers'' favourite.',
    500, true, 1)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;
