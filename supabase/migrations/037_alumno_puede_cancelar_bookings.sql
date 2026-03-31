-- Permite al alumno cancelar sus propias clases (pendiente o confirmada → cancelado).
-- El campo alumno_id no puede cambiar, solo el status.
drop policy if exists "alumnos_pueden_cancelar_propios_bookings" on public.bookings;
create policy "alumnos_pueden_cancelar_propios_bookings"
  on public.bookings
  for update
  to authenticated
  using (
    auth.uid() = alumno_id
    and status in ('pendiente', 'confirmado')
  )
  with check (
    auth.uid() = alumno_id
    and status = 'cancelado'
  );
