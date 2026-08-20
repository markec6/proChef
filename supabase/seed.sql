begin;

-- ============================================================
-- LOCATIONS
-- ============================================================
insert into public.locations (id, name, code, is_active)
values
  ('00000000-0000-4000-8000-000000000001', 'Dobanovci - Glavni Hub', 'DOBANOVCI', true),
  ('00000000-0000-4000-8000-000000000002', 'Geneks - Restoran', 'GENEKS', true),
  ('00000000-0000-4000-8000-000000000003', 'Zvezdara - Kuhinja', 'ZVEZDARA', true)
on conflict do nothing;

-- ============================================================
-- CATEGORIES
-- public.categories has: id, name
-- The name stores the stable category code used by the app.
-- ============================================================
insert into public.categories (id, name)
values
  ('10000000-0000-4000-8000-000000000001', 'MEAT'),
  ('10000000-0000-4000-8000-000000000002', 'VEGETABLES'),
  ('10000000-0000-4000-8000-000000000003', 'FRUIT'),
  ('10000000-0000-4000-8000-000000000004', 'BEVERAGES'),
  ('10000000-0000-4000-8000-000000000005', 'DAIRY'),
  ('10000000-0000-4000-8000-000000000006', 'DRY_GOODS')
on conflict do nothing;

-- ============================================================
-- PRODUCTS
-- ============================================================
with product_values (id, name, category_name, unit) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Pileći file', 'MEAT', 'KG'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Svinjski vrat b/k', 'MEAT', 'KG'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Juneći but', 'MEAT', 'KG'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Mleveno mešano meso', 'MEAT', 'KG'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Kobasica roštiljska', 'MEAT', 'KG'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Krompir beli', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Šargarepa', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Crni luk', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Sveži kupus', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Paprika babura', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Paradajz', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'Tikvice', 'VEGETABLES', 'KG'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'Jabuka Zlatni Delišes', 'FRUIT', 'KG'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'Banana', 'FRUIT', 'KG'),
    ('20000000-0000-4000-8000-000000000015'::uuid, 'Pomorandža', 'FRUIT', 'KG'),
    ('20000000-0000-4000-8000-000000000016'::uuid, 'Limun', 'FRUIT', 'KG'),
    ('20000000-0000-4000-8000-000000000017'::uuid, 'Mleko 2.8%', 'DAIRY', 'L'),
    ('20000000-0000-4000-8000-000000000018'::uuid, 'Kiselo mleko 700g', 'DAIRY', 'PAK'),
    ('20000000-0000-4000-8000-000000000019'::uuid, 'Pasterizovani sir', 'DAIRY', 'KG'),
    ('20000000-0000-4000-8000-000000000020'::uuid, 'Maslac 250g', 'DAIRY', 'PAK'),
    ('20000000-0000-4000-8000-000000000021'::uuid, 'Kisela pavlaka 20%', 'DAIRY', 'KG'),
    ('20000000-0000-4000-8000-000000000022'::uuid, 'Pšenično brašno T-500', 'DRY_GOODS', 'KG'),
    ('20000000-0000-4000-8000-000000000023'::uuid, 'Pirinač okruglo zrno', 'DRY_GOODS', 'KG'),
    ('20000000-0000-4000-8000-000000000024'::uuid, 'Suncokretovo ulje', 'DRY_GOODS', 'L'),
    ('20000000-0000-4000-8000-000000000025'::uuid, 'Kuhinjska so', 'DRY_GOODS', 'KG'),
    ('20000000-0000-4000-8000-000000000026'::uuid, 'Crni biber mleveni', 'DRY_GOODS', 'KG'),
    ('20000000-0000-4000-8000-000000000027'::uuid, 'Testenina svrdla', 'DRY_GOODS', 'KG'),
    ('20000000-0000-4000-8000-000000000028'::uuid, 'Šećer kristal', 'DRY_GOODS', 'KG'),
    ('20000000-0000-4000-8000-000000000029'::uuid, 'Gazirana voda 1.5l', 'BEVERAGES', 'PAK'),
    ('20000000-0000-4000-8000-000000000030'::uuid, 'Sok od pomorandže 1l', 'BEVERAGES', 'L'),
    ('20000000-0000-4000-8000-000000000031'::uuid, 'Kafa espresso', 'BEVERAGES', 'KG')
)
insert into public.products (id, name, category_id, unit)
select
  product_values.id,
  product_values.name,
  public.categories.id,
  product_values.unit
from product_values
join public.categories on public.categories.name = product_values.category_name
on conflict do nothing;

-- ============================================================
-- INVENTORY
-- Cross-links every product with every location.
-- Location IDs are resolved from existing location codes for safe re-runs.
-- ============================================================
with stock_matrix (
  product_id,
  min_stock,
  dobanovci_stock,
  geneks_stock,
  zvezdara_stock
) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 80, 148, 92, 64),
    ('20000000-0000-4000-8000-000000000002'::uuid, 40, 36, 44, 22),
    ('20000000-0000-4000-8000-000000000003'::uuid, 35, 58, 38, 28),
    ('20000000-0000-4000-8000-000000000004'::uuid, 50, 61, 48, 33),
    ('20000000-0000-4000-8000-000000000005'::uuid, 18, 32, 20, 12),
    ('20000000-0000-4000-8000-000000000006'::uuid, 120, 210, 132, 96),
    ('20000000-0000-4000-8000-000000000007'::uuid, 40, 55, 42, 28),
    ('20000000-0000-4000-8000-000000000008'::uuid, 35, 70, 38, 24),
    ('20000000-0000-4000-8000-000000000009'::uuid, 30, 48, 33, 18),
    ('20000000-0000-4000-8000-000000000010'::uuid, 22, 26, 20, 14),
    ('20000000-0000-4000-8000-000000000011'::uuid, 28, 45, 31, 16),
    ('20000000-0000-4000-8000-000000000012'::uuid, 16, 22, 17, 9),
    ('20000000-0000-4000-8000-000000000013'::uuid, 40, 72, 44, 31),
    ('20000000-0000-4000-8000-000000000014'::uuid, 25, 38, 28, 18),
    ('20000000-0000-4000-8000-000000000015'::uuid, 20, 34, 22, 12),
    ('20000000-0000-4000-8000-000000000016'::uuid, 12, 18, 13, 8),
    ('20000000-0000-4000-8000-000000000017'::uuid, 45, 80, 50, 32),
    ('20000000-0000-4000-8000-000000000018'::uuid, 24, 40, 26, 15),
    ('20000000-0000-4000-8000-000000000019'::uuid, 18, 21, 16, 10),
    ('20000000-0000-4000-8000-000000000020'::uuid, 16, 28, 18, 11),
    ('20000000-0000-4000-8000-000000000021'::uuid, 10, 19, 11, 6),
    ('20000000-0000-4000-8000-000000000022'::uuid, 50, 90, 55, 38),
    ('20000000-0000-4000-8000-000000000023'::uuid, 40, 76, 44, 29),
    ('20000000-0000-4000-8000-000000000024'::uuid, 30, 36, 28, 18),
    ('20000000-0000-4000-8000-000000000025'::uuid, 12, 24, 14, 8),
    ('20000000-0000-4000-8000-000000000026'::uuid, 4, 6.5, 4.2, 2.4),
    ('20000000-0000-4000-8000-000000000027'::uuid, 22, 40, 24, 15),
    ('20000000-0000-4000-8000-000000000028'::uuid, 25, 48, 27, 16),
    ('20000000-0000-4000-8000-000000000029'::uuid, 20, 42, 22, 12),
    ('20000000-0000-4000-8000-000000000030'::uuid, 18, 30, 20, 10),
    ('20000000-0000-4000-8000-000000000031'::uuid, 8, 14, 9, 5)
),
location_stock as (
  select
    stock_matrix.product_id,
    stock_matrix.min_stock,
    stock_by_code.location_code,
    stock_by_code.current_stock
  from stock_matrix
  cross join lateral (
    values
      ('DOBANOVCI'::public.location_code, stock_matrix.dobanovci_stock),
      ('GENEKS'::public.location_code, stock_matrix.geneks_stock),
      ('ZVEZDARA'::public.location_code, stock_matrix.zvezdara_stock)
  ) as stock_by_code(location_code, current_stock)
),
inventory_rows as (
  select
    location_stock.product_id,
    public.locations.id as location_id,
    location_stock.current_stock,
    location_stock.min_stock,
    md5(public.locations.id::text || location_stock.product_id::text) as row_hash
  from location_stock
  join public.locations on public.locations.code = location_stock.location_code
)
insert into public.inventory (
  id,
  product_id,
  location_id,
  current_stock,
  min_stock
)
select
  (
    substr(row_hash, 1, 8) || '-' ||
    substr(row_hash, 9, 4) || '-4' ||
    substr(row_hash, 14, 3) || '-8' ||
    substr(row_hash, 18, 3) || '-' ||
    substr(row_hash, 21, 12)
  )::uuid,
  product_id,
  location_id,
  current_stock,
  min_stock
from inventory_rows
on conflict do nothing;

commit;
