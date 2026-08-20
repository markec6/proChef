revoke all on table public.activity_logs from anon, authenticated, public;
grant select on table public.activity_logs to authenticated;

revoke all on function public.log_activity(public.activity_action, text, text, text) from public, anon;
revoke all on function public.update_inventory_stock_with_activity(uuid, numeric, text) from public, anon;
revoke all on function public.is_current_user_admin() from public, anon;

grant execute on function public.log_activity(public.activity_action, text, text, text) to authenticated;
grant execute on function public.update_inventory_stock_with_activity(uuid, numeric, text) to authenticated;
grant execute on function public.is_current_user_admin() to authenticated;
