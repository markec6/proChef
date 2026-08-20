create or replace function public.update_inventory_stock_with_activity(
  p_inventory_id uuid,
  p_new_stock numeric,
  p_details text default null
)
returns table (
  id uuid,
  current_stock numeric,
  min_stock numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inventory_record public.inventory%rowtype;
  product_name text;
  product_unit text;
  location_name text;
  detail_text text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to update inventory';
  end if;

  if p_new_stock < 0 then
    raise exception 'Inventory stock cannot be negative';
  end if;

  select inventory.*
  into inventory_record
  from public.inventory
  where inventory.id = p_inventory_id
  for update;

  if inventory_record.id is null then
    raise exception 'Inventory row was not found';
  end if;

  select products.name, products.unit
  into product_name, product_unit
  from public.products
  where products.id = inventory_record.product_id;

  select locations.name
  into location_name
  from public.locations
  where locations.id = inventory_record.location_id;

  update public.inventory
  set current_stock = p_new_stock
  where inventory.id = p_inventory_id
  returning inventory.id, inventory.current_stock, inventory.min_stock
  into id, current_stock, min_stock;

  detail_text := coalesce(
    nullif(trim(p_details), ''),
    format(
      'Količina promenjena sa %s%s na %s%s na lokaciji %s',
      inventory_record.current_stock,
      coalesce(' ' || product_unit, ''),
      p_new_stock,
      coalesce(' ' || product_unit, ''),
      coalesce(location_name, 'nepoznata lokacija')
    )
  );

  perform public.log_activity(
    'UPDATE'::public.activity_action,
    'Magacin',
    coalesce(product_name, p_inventory_id::text),
    detail_text
  );

  return next;
end;
$$;

grant execute on function public.update_inventory_stock_with_activity(uuid, numeric, text) to authenticated;

update public.activity_logs
set details = regexp_replace(
  details,
  '^Quantity changed from (.*) to (.*) at (.*)$',
  'Količina promenjena sa \1 na \2 na lokaciji \3'
)
where details like 'Quantity changed from %';
