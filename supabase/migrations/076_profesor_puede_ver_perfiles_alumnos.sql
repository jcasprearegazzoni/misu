-- Permite a un profesor leer el perfil de un alumno
-- solo si existe al menos un booking entre ellos.
create policy "Profesores pueden ver perfiles de sus alumnos"
  on public.profiles
  for select
  to authenticated
  using (
    role = 'alumno'
    and exists (
      select 1 from bookings b
      where b.profesor_id = auth.uid()
        and b.alumno_id = profiles.user_id
    )
  );
