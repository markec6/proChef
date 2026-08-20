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
    when 'ADMIN' then 'ADMIN'::public.user_role
    when 'NUTRICIONISTA' then 'NUTRICIONISTA'::public.user_role
    when 'MAGACIONER' then 'MAGACIONER'::public.user_role
    when 'KUVAR' then 'KUVAR'::public.user_role
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
