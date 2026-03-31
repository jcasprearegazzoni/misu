-- Permite que cualquier usuario autenticado vea paquetes activos
-- (necesario para que el alumno vea los paquetes del profesor en el perfil público).
drop policy if exists "packages_select_active_authenticated" on public.packages;
create policy "packages_select_active_authenticated"
  on public.packages
  for select
  to authenticated
  using (active = true);

-- Permite al alumno insertar su propio student_package (autopurchase).
drop policy if exists "student_packages_insert_alumno_own" on public.student_packages;
create policy "student_packages_insert_alumno_own"
  on public.student_packages
  for insert
  to authenticated
  with check (alumno_id = auth.uid());

-- Permite UPDATE de classes_remaining en packages propios del alumno
-- (necesario para la cancelación de clases con crédito consumido cuando
--  la acción corre como alumno y no como profesor).
-- NOTA: la restauración de créditos se hace vía admin client en el código,
-- esta policy es un fallback para futuras RPCs.
grant update (classes_remaining) on table public.student_packages to authenticated;

drop policy if exists "student_packages_update_classes_remaining_alumno" on public.student_packages;
create policy "student_packages_update_classes_remaining_alumno"
  on public.student_packages
  for update
  to authenticated
  using (alumno_id = auth.uid())
  with check (alumno_id = auth.uid());
