alter table public.activity_logs
  drop constraint if exists activity_logs_user_id_fkey;

alter table public.activity_logs
  add constraint activity_logs_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

alter table public.invoices
  drop constraint if exists invoices_created_by_user_id_fkey;

alter table public.invoices
  add constraint invoices_created_by_user_id_fkey
  foreign key (created_by_user_id)
  references public.profiles(id)
  on delete cascade;

alter table public.stock_logs
  drop constraint if exists stock_logs_user_id_fkey;

alter table public.stock_logs
  add constraint stock_logs_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.activity_logs
  where user_id = uid;

  delete from public.invoices
  where created_by_user_id = uid;

  delete from public.stock_logs
  where user_id = uid;

  delete from public.profiles
  where id = uid;

  delete from auth.users
  where id = uid;
end;
$$;

revoke all on function public.delete_user_account() from public;
revoke all on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated;
