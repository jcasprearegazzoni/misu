-- Corrige políticas de INSERT que no se aplicaron correctamente en 060.
-- Necesario para permitir que anon y authenticated puedan crear reservas y participantes.

drop policy if exists "reservas_insert_public" on public.reservas_cancha;
create policy "reservas_insert_public"
  on public.reservas_cancha for insert
  to anon, authenticated
  with check (true);

drop policy if exists "participantes_insert_public" on public.reserva_participantes;
create policy "participantes_insert_public"
  on public.reserva_participantes for insert
  to anon, authenticated
  with check (true);
