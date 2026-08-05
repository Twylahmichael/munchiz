-- ============================================================
-- Munchiz — Menu v3: reconcile with printed Munchiz menu cards
-- Idempotent: safe to re-run.
--   * Adds items that were on the printed menu but missing from
--     the DB (plain Beef Burger, Chicken Burger, 2/3 piece
--     chicken, Family Bucket Combo, Large Fries, Samosa, Smokie,
--     extra patty/cheese, extra toppings for burgers and pizzas).
--   * Corrects prices where the printed card disagreed with the
--     v2 seed (cheesy beef/chicken burgers, chicken nuggets).
--   * Fills photo_url on every item with a real food photo
--     from Unsplash so the site is populated out of the box.
--     Admins can replace these via Admin → Meals (Upload or URL).
-- ============================================================

-- ------------------------------------------------------------
-- 0. SITE SETTINGS — refresh Google Maps embed to the real
--    Munchiz pin on Kanisani Road, Kamulu.
-- ------------------------------------------------------------
update public.site_settings
  set google_maps_embed_url = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8068613158825!2d37.034811475756094!3d-1.290162435632001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f6dd8fa38a10b%3A0x6780b0b36d107995!2sMunchiz!5e0!3m2!1sen!2ske!4v1785830800938!5m2!1sen!2ske'
  where id = 'd1000000-0000-0000-0000-000000000001';

-- ------------------------------------------------------------
-- 1. EXTRA CATEGORIES
-- ------------------------------------------------------------
insert into public.categories (id, name, slug, sort_order, icon, is_active) values
  ('a2000000-0000-0000-0000-000000000004', 'Extras',   'extras',   9,  '➕', true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  icon = excluded.icon,
  is_active = excluded.is_active;

-- ------------------------------------------------------------
-- 2. PRICE FIXES for items already in v2
-- ------------------------------------------------------------
-- Printed card: Cheesy Beef Burger 350, Cheesy Chicken Burger 350.
update public.menu_items set price = 350
  where id = 'b2000000-0000-0000-0000-000000000301';
update public.menu_items set price = 350
  where id = 'b2000000-0000-0000-0000-000000000302';

-- Printed card: 7 piece nuggets 250. v2 had "large nuggets" at 250 -> rename.
update public.menu_items
  set name = '7 Piece Chicken Nuggets',
      description = 'Seven golden, crispy nuggets served with your choice of sauce.'
  where id = 'b2000000-0000-0000-0000-000000000402';

-- Rename existing "Chips" to "Medium Seasoned Fries" (printed card).
update public.menu_items
  set name = 'Medium Seasoned Fries',
      description = 'Golden, seasoned, perfectly crispy. Comes with ketchup.'
  where id = 'b2000000-0000-0000-0000-000000000501';

-- Rename existing "Sausage" side to "Sausages" (printed card).
update public.menu_items
  set name = 'Sausages',
      description = 'Grilled sausages with a hint of spice.'
  where id = 'b2000000-0000-0000-0000-000000000502';

-- Rename small "Chicken Nuggets" to "2 Piece Chicken" for accuracy (300/=).
update public.menu_items
  set name = '2 Piece Chicken',
      description = 'Two pieces of chicken, marinated, coated and deep-fried. Comes with small fries.',
      price = 300
  where id = 'b2000000-0000-0000-0000-000000000401';

-- ------------------------------------------------------------
-- 3. NEW ITEMS from the printed menu
-- ------------------------------------------------------------

-- Burgers -------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000303', 'a1000000-0000-0000-0000-000000000001',
    'Beef Burger',
    'Juicy beef patty with fresh lettuce, tomato and our secret sauce. Served with small fries.',
    250, true, 3),
  ('b2000000-0000-0000-0000-000000000304', 'a1000000-0000-0000-0000-000000000001',
    'Chicken Burger',
    'Two slices of crispy chicken breast, fresh lettuce and mayo. Served with small fries.',
    250, true, 4)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Chicken -------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000403', 'a1000000-0000-0000-0000-000000000004',
    '3 Piece Chicken',
    'Three pieces of chicken, marinated, coated and deep-fried. Comes with small fries.',
    400, true, 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Combos: Family Bucket ----------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000111', 'a2000000-0000-0000-0000-000000000001',
    'Family Bucket Combo',
    'Fried chicken bucket + family-sized fries + 1.25L soda. Feeds the whole crew.',
    1150, true, 11)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Sides ---------------------------------------------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000503', 'a1000000-0000-0000-0000-000000000003',
    'Large Seasoned Fries',
    'A larger portion of our golden, seasoned, perfectly crispy fries.',
    150, true, 3),
  ('b2000000-0000-0000-0000-000000000504', 'a1000000-0000-0000-0000-000000000003',
    'Samosa',
    'Crispy samosa – choose fried or non-fried at checkout.',
    30, true, 4),
  ('b2000000-0000-0000-0000-000000000505', 'a1000000-0000-0000-0000-000000000003',
    'Smokie',
    'Grilled smokie, ready to go.',
    40, true, 5)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- Extras: burger add-ons and pizza toppings --------------------
insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order) values
  ('b2000000-0000-0000-0000-000000000901', 'a2000000-0000-0000-0000-000000000004',
    'Extra Beef Patty',
    'Add another juicy beef patty to any burger.',
    100, true, 1),
  ('b2000000-0000-0000-0000-000000000902', 'a2000000-0000-0000-0000-000000000004',
    'Extra Cheese Slice',
    'Add an extra slice of melted cheese to any burger.',
    100, true, 2),
  ('b2000000-0000-0000-0000-000000000903', 'a2000000-0000-0000-0000-000000000004',
    'Extra Beef Topping',
    'Add extra beef to any burger or pizza.',
    100, true, 3),
  ('b2000000-0000-0000-0000-000000000904', 'a2000000-0000-0000-0000-000000000004',
    'Extra Chicken Topping',
    'Add extra chicken to any burger or pizza.',
    100, true, 4),
  ('b2000000-0000-0000-0000-000000000905', 'a2000000-0000-0000-0000-000000000004',
    'Extra Pepperoni',
    'Add extra pepperoni to any burger or pizza.',
    100, true, 5),
  ('b2000000-0000-0000-0000-000000000906', 'a2000000-0000-0000-0000-000000000004',
    'Extra Ham',
    'Add extra ham to any burger or pizza.',
    100, true, 6),
  ('b2000000-0000-0000-0000-000000000907', 'a2000000-0000-0000-0000-000000000004',
    'Extra Cheese (Pizza)',
    'Add extra mozzarella to any pizza.',
    100, true, 7),
  ('b2000000-0000-0000-0000-000000000908', 'a2000000-0000-0000-0000-000000000004',
    'Olives',
    'Add olives to any pizza.',
    100, true, 8),
  ('b2000000-0000-0000-0000-000000000909', 'a2000000-0000-0000-0000-000000000004',
    'Capsicum',
    'Add capsicum to any pizza.',
    50, true, 9),
  ('b2000000-0000-0000-0000-000000000910', 'a2000000-0000-0000-0000-000000000004',
    'Onion Rings',
    'Add onion rings to any pizza.',
    50, true, 10)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category_id = excluded.category_id,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 4. PHOTO URLS — real Unsplash food photos as placeholders.
-- Admins can overwrite these anytime via Admin → Meals.
-- ------------------------------------------------------------

-- Combos
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000101';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000102';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000103';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000104';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000105';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000106';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1599921841143-819065280020?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000107';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000108';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000109';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000110';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000111';

-- Pizzas — BBQ Beef
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000201',
  'b2000000-0000-0000-0000-000000000202',
  'b2000000-0000-0000-0000-000000000203',
  'b2000000-0000-0000-0000-000000000204'
);
-- BBQ Chicken
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000211',
  'b2000000-0000-0000-0000-000000000212',
  'b2000000-0000-0000-0000-000000000213',
  'b2000000-0000-0000-0000-000000000214'
);
-- Margherita
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000221',
  'b2000000-0000-0000-0000-000000000222',
  'b2000000-0000-0000-0000-000000000223',
  'b2000000-0000-0000-0000-000000000224'
);
-- Pepperoni
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000231',
  'b2000000-0000-0000-0000-000000000232',
  'b2000000-0000-0000-0000-000000000233',
  'b2000000-0000-0000-0000-000000000234'
);
-- Hawaiian
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000241',
  'b2000000-0000-0000-0000-000000000242',
  'b2000000-0000-0000-0000-000000000243',
  'b2000000-0000-0000-0000-000000000244'
);
-- Meat Lovers
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000251',
  'b2000000-0000-0000-0000-000000000252',
  'b2000000-0000-0000-0000-000000000253',
  'b2000000-0000-0000-0000-000000000254'
);

-- Burgers
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000301';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000302';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000303';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1615297928064-24977384d0da?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000304';

-- Chicken
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000401';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000402';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000403';

-- Sides
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000501';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000502';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000503';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000504';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1599921841143-819065280020?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000505';

-- Drinks (juices)
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000601';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000602';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000603';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000604';

-- Sauces
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1607690424560-35d967d6ea56?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000701',
  'b2000000-0000-0000-0000-000000000703'
);
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&q=80&auto=format&fit=crop' where id in (
  'b2000000-0000-0000-0000-000000000702',
  'b2000000-0000-0000-0000-000000000704'
);

-- Kiddies
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000801';

-- Extras
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000901';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000902';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000903';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000904';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000905';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000906';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000907';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1568569350062-ebfa3cb195df?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000908';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000909';
update public.menu_items set photo_url = 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80&auto=format&fit=crop' where id = 'b2000000-0000-0000-0000-000000000910';
