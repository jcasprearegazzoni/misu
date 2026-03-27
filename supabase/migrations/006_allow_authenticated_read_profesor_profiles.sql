drop policy if exists "Usuarios autenticados pueden ver perfiles de profesores" on public.profiles;
create policy "Usuarios autenticados pueden ver perfiles de profesores"
  on public.profiles
  for select
  to authenticated
  using (role = 'profesor');
