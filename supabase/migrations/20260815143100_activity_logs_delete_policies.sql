grant delete on table public.activity_logs to authenticated;

create policy "Users can delete their own activity logs"
  on public.activity_logs
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can delete all activity logs"
  on public.activity_logs
  for delete
  to authenticated
  using (public.is_current_user_admin());
