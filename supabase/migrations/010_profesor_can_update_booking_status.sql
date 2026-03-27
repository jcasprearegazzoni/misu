drop policy if exists "Profesores pueden actualizar bookings recibidos" on public.bookings;
create policy "Profesores pueden actualizar bookings recibidos"
  on public.bookings
  for update
  to authenticated
  using (auth.uid() = profesor_id)
  with check (
    auth.uid() = profesor_id
    and status in ('pendiente', 'confirmado', 'cancelado')
  );
