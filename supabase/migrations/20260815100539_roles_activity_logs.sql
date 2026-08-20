alter table public.profiles alter column role drop default;

create type public.user_role_new as enum ('ADMIN', 'NUTRICIONISTA', 'KUVAR');

alter table public.profiles
  alter column role type public.user_role_new
  using (
    case role::text
      when 'ADMIN' then 'ADMIN'::public.user_role_new
      when 'NUTRICIONISTA' then 'NUTRICIONISTA'::public.user_role_new
      else 'KUVAR'::public.user_role_new
    end
  );

drop type public.user_role;

alter type public.user_role_new rename to user_role;

alter table public.profiles
  alter column role set default 'KUVAR'::public.user_role,
  alter column role set not null;

create type public.activity_action as enum ('CREATE', 'UPDATE', 'DELETE', 'PRINT');

create table if not exists public.activity_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  user_name text not null,
  user_role public.user_role not null,
  action public.activity_action not null,
  module text not null,
  target_item text not null,
  details text not null,
  created_at timestamp with time zone not null default now(),
  constraint activity_logs_module_check check (
    module in ('Magacin', 'Jelovnik', 'Specijalci', 'Interna A', 'I Hirurška')
  )
);

alter table public.activity_logs enable row level security;

revoke insert, update, delete on public.activity_logs from anon, authenticated;
grant select on public.activity_logs to authenticated;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'::public.user_role
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is null then
    raise exception 'Profile role is required';
  end if;

  if tg_op = 'UPDATE'
    and new.role is distinct from old.role
    and not public.is_current_user_admin()
  then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
  before insert or update on public.profiles
  for each row
  execute function public.prevent_profile_role_escalation();

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_record.policyname);
  end loop;
end;
$$;

create policy "Profiles are readable by owner or admin"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_current_user_admin());

create policy "Users can update their own non-role profile fields"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update all profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "Users can read their own activity logs"
  on public.activity_logs
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can read all activity logs"
  on public.activity_logs
  for select
  to authenticated
  using (public.is_current_user_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  assigned_role public.user_role;
begin
  assigned_role := case requested_role
    when 'NUTRICIONISTA' then 'NUTRICIONISTA'::public.user_role
    else 'KUVAR'::public.user_role
  end;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Zaposleni'),
    assigned_role
  );

  return new;
end;
$$;

create or replace function public.log_activity(
  p_action public.activity_action,
  p_module text,
  p_target_item text,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor public.profiles%rowtype;
  activity_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to log activity';
  end if;

  select *
  into actor
  from public.profiles
  where id = auth.uid();

  if actor.id is null then
    raise exception 'Authenticated user profile was not found';
  end if;

  insert into public.activity_logs (
    user_id,
    user_name,
    user_role,
    action,
    module,
    target_item,
    details
  )
  values (
    actor.id,
    actor.full_name,
    actor.role,
    p_action,
    p_module,
    nullif(trim(p_target_item), ''),
    nullif(trim(p_details), '')
  )
  returning id into activity_id;

  return activity_id;
end;
$$;

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
      'Quantity changed from %s%s to %s%s at %s',
      inventory_record.current_stock,
      coalesce(' ' || product_unit, ''),
      p_new_stock,
      coalesce(' ' || product_unit, ''),
      coalesce(location_name, 'unknown location')
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

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.log_activity(public.activity_action, text, text, text) to authenticated;
grant execute on function public.update_inventory_stock_with_activity(uuid, numeric, text) to authenticated;
