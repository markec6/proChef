alter table public.activity_logs
  drop constraint activity_logs_module_check;

alter table public.activity_logs
  add constraint activity_logs_module_check
  check (
    module in (
      'Magacin',
      'Jelovnik',
      'Specijalci',
      'Interna A',
      'I Hirurška',
      'Fakture'
    )
  );

create type public.invoice_status as enum ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id text not null,
  client_name text not null,
  client_pib text not null,
  client_address text not null,
  issue_date date not null,
  due_date date not null,
  period_start date not null,
  period_end date not null,
  subtotal_amount numeric(14, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 20.00,
  tax_amount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  status public.invoice_status not null default 'DRAFT',
  note text,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_by_user_name text not null,
  created_at timestamptz not null default now(),
  constraint invoices_dates_check check (
    due_date >= issue_date
    and period_end >= period_start
  ),
  constraint invoices_tax_rate_check check (tax_rate >= 0 and tax_rate <= 100),
  constraint invoices_amounts_check check (
    subtotal_amount >= 0
    and tax_amount >= 0
    and total_amount >= 0
  )
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null,
  unit_price numeric(12, 2) not null,
  total_price numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  constraint invoice_items_qty_check check (quantity > 0),
  constraint invoice_items_price_check check (unit_price >= 0 and total_price >= 0)
);

create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_status_idx on public.invoices (status);
create index invoices_issue_date_idx on public.invoices (issue_date desc);
create index invoices_period_idx on public.invoices (period_start, period_end);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

create or replace function public.next_invoice_number(p_year integer default null)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_year integer;
  next_seq integer;
begin
  target_year := coalesce(
    p_year,
    extract(year from timezone('Europe/Belgrade', now()))::integer
  );

  perform pg_advisory_xact_lock(hashtext('prochef_invoice_number_' || target_year::text));

  select coalesce(max(substring(invoice_number from 10)::integer), 0) + 1
  into next_seq
  from public.invoices
  where invoice_number ~ ('^FAK-' || target_year::text || '-[0-9]{4}$');

  return format('FAK-%s-%s', target_year, lpad(next_seq::text, 4, '0'));
end;
$$;

create or replace function public.format_invoice_rsd(p_amount numeric)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select replace(
    replace(
      replace(to_char(p_amount, 'FM999,999,999,990.00'), ',', 'X'),
      '.',
      ','
    ),
    'X',
    '.'
  );
$$;

create or replace function public.log_invoice_created_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  perform public.log_activity(
    'CREATE'::public.activity_action,
    'Fakture',
    new.invoice_number,
    format(
      'Kreirana nova faktura %s za klijenta %s u iznosu od %s RSD',
      new.invoice_number,
      new.client_name,
      public.format_invoice_rsd(new.total_amount)
    )
  );

  return new;
end;
$$;

create or replace function public.log_invoice_status_changed_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  perform public.log_activity(
    'UPDATE'::public.activity_action,
    'Fakture',
    new.invoice_number,
    format(
      'Status fakture %s promenjen iz %s u %s',
      new.invoice_number,
      old.status::text,
      new.status::text
    )
  );

  return new;
end;
$$;

drop trigger if exists invoices_log_created_activity on public.invoices;
create trigger invoices_log_created_activity
  after insert on public.invoices
  for each row
  execute function public.log_invoice_created_activity();

drop trigger if exists invoices_log_status_changed_activity on public.invoices;
create trigger invoices_log_status_changed_activity
  after update of status on public.invoices
  for each row
  execute function public.log_invoice_status_changed_activity();

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

revoke all on table public.invoices from anon, public;
revoke all on table public.invoice_items from anon, public;
grant select, insert, update, delete on table public.invoices to authenticated;
grant select, insert, update, delete on table public.invoice_items to authenticated;

create policy "Authenticated users can read invoices"
  on public.invoices
  for select
  to authenticated
  using (true);

create policy "Admins can insert invoices"
  on public.invoices
  for insert
  to authenticated
  with check (public.is_current_user_admin());

create policy "Admins can update invoices"
  on public.invoices
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "Admins can delete invoices"
  on public.invoices
  for delete
  to authenticated
  using (public.is_current_user_admin());

create policy "Authenticated users can read invoice items"
  on public.invoice_items
  for select
  to authenticated
  using (true);

create policy "Admins can insert invoice items"
  on public.invoice_items
  for insert
  to authenticated
  with check (public.is_current_user_admin());

create policy "Admins can update invoice items"
  on public.invoice_items
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "Admins can delete invoice items"
  on public.invoice_items
  for delete
  to authenticated
  using (public.is_current_user_admin());

grant execute on function public.next_invoice_number(integer) to authenticated;
grant execute on function public.format_invoice_rsd(numeric) to authenticated;

do $$
declare
  actor public.profiles%rowtype;
begin
  select *
  into actor
  from public.profiles
  order by created_at asc, id asc
  limit 1;

  if actor.id is null then
    return;
  end if;

  insert into public.invoices (
    id,
    invoice_number,
    client_id,
    client_name,
    client_pib,
    client_address,
    issue_date,
    due_date,
    period_start,
    period_end,
    subtotal_amount,
    tax_rate,
    tax_amount,
    total_amount,
    status,
    note,
    created_by_user_id,
    created_by_user_name
  )
  values
    (
      '30000000-0000-4000-8000-000000000001',
      'FAK-2026-0001',
      'kbc-geneks',
      'KBC Geneks',
      '100000001',
      'Bulevar Arsenija Čarnojevića 178, 11070 Novi Beograd (test)',
      '2026-07-01',
      '2026-07-16',
      '2026-06-01',
      '2026-06-30',
      1201650.00,
      20.00,
      240330.00,
      1441980.00,
      'PAID',
      'Test ugovor KBC Geneks — jun 2026.',
      actor.id,
      actor.full_name
    ),
    (
      '30000000-0000-4000-8000-000000000002',
      'FAK-2026-0002',
      'i-hirurska',
      'I Hirurška',
      '100000002',
      'Pasterova 2, 11000 Beograd (test)',
      '2026-07-02',
      '2026-07-17',
      '2026-06-01',
      '2026-06-30',
      576200.00,
      20.00,
      115240.00,
      691440.00,
      'PAID',
      'Test ugovor I Hirurška — jun 2026.',
      actor.id,
      actor.full_name
    ),
    (
      '30000000-0000-4000-8000-000000000003',
      'FAK-2026-0003',
      'kbc-geneks',
      'KBC Geneks',
      '100000001',
      'Bulevar Arsenija Čarnojevića 178, 11070 Novi Beograd (test)',
      '2026-08-01',
      '2026-08-16',
      '2026-07-01',
      '2026-07-31',
      1228000.00,
      20.00,
      245600.00,
      1473600.00,
      'ISSUED',
      'Test ugovor KBC Geneks — jul 2026.',
      actor.id,
      actor.full_name
    ),
    (
      '30000000-0000-4000-8000-000000000004',
      'FAK-2026-0004',
      'interna-a',
      'Interna A',
      '100000003',
      'Dr Subotića 13, 11000 Beograd (test)',
      '2026-08-03',
      '2026-08-18',
      '2026-07-01',
      '2026-07-31',
      863200.00,
      20.00,
      172640.00,
      1035840.00,
      'ISSUED',
      'Test ugovor Interna A — jul 2026.',
      actor.id,
      actor.full_name
    ),
    (
      '30000000-0000-4000-8000-000000000005',
      'FAK-2026-0005',
      'kbc-geneks',
      'KBC Geneks',
      '100000001',
      'Bulevar Arsenija Čarnojevića 178, 11070 Novi Beograd (test)',
      '2026-08-15',
      '2026-08-30',
      '2026-08-01',
      '2026-08-15',
      412100.00,
      20.00,
      82420.00,
      494520.00,
      'DRAFT',
      'Nacrt obračuna KBC Geneks — avgust 2026.',
      actor.id,
      actor.full_name
    )
  on conflict (invoice_number) do nothing;

  insert into public.invoice_items (
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    total_price
  )
  values
    (
      '31000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      'Opšti obrok - Doručak/Ručak/Večera',
      2100,
      450.00,
      945000.00
    ),
    (
      '31000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      'Dijetalna ishrana - Dijabet',
      420,
      520.00,
      218400.00
    ),
    (
      '31000000-0000-4000-8000-000000000003',
      '30000000-0000-4000-8000-000000000001',
      'Sonda ishrana',
      45,
      850.00,
      38250.00
    ),
    (
      '31000000-0000-4000-8000-000000000004',
      '30000000-0000-4000-8000-000000000002',
      'Opšti obrok - Doručak/Ručak/Večera',
      980,
      450.00,
      441000.00
    ),
    (
      '31000000-0000-4000-8000-000000000005',
      '30000000-0000-4000-8000-000000000002',
      'Dijetalna ishrana - Dijabet',
      260,
      520.00,
      135200.00
    ),
    (
      '31000000-0000-4000-8000-000000000006',
      '30000000-0000-4000-8000-000000000003',
      'Opšti obrok - Doručak/Ručak/Večera',
      2180,
      450.00,
      981000.00
    ),
    (
      '31000000-0000-4000-8000-000000000007',
      '30000000-0000-4000-8000-000000000003',
      'Dijetalna ishrana - Dijabet',
      390,
      520.00,
      202800.00
    ),
    (
      '31000000-0000-4000-8000-000000000008',
      '30000000-0000-4000-8000-000000000003',
      'Sonda ishrana',
      52,
      850.00,
      44200.00
    ),
    (
      '31000000-0000-4000-8000-000000000009',
      '30000000-0000-4000-8000-000000000004',
      'Opšti obrok - Doručak/Ručak/Večera',
      1560,
      450.00,
      702000.00
    ),
    (
      '31000000-0000-4000-8000-000000000010',
      '30000000-0000-4000-8000-000000000004',
      'Dijetalna ishrana - Dijabet',
      310,
      520.00,
      161200.00
    ),
    (
      '31000000-0000-4000-8000-000000000011',
      '30000000-0000-4000-8000-000000000005',
      'Opšti obrok - Doručak/Ručak/Večera',
      720,
      450.00,
      324000.00
    ),
    (
      '31000000-0000-4000-8000-000000000012',
      '30000000-0000-4000-8000-000000000005',
      'Dijetalna ishrana - Dijabet',
      140,
      520.00,
      72800.00
    ),
    (
      '31000000-0000-4000-8000-000000000013',
      '30000000-0000-4000-8000-000000000005',
      'Sonda ishrana',
      18,
      850.00,
      15300.00
    )
  on conflict (id) do nothing;
end;
$$;
