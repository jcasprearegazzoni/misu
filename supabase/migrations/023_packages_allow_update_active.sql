grant update (active) on table public.packages to authenticated;

drop policy if exists "packages_update_active_profesor_own" on public.packages;
create policy "packages_update_active_profesor_own"
  on public.packages
  for update
  to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

