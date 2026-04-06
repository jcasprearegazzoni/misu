-- Permite que cada alumno vea sus propias reservas de cancha y participantes.
-- Sin estas policies, solo el club podia leer reservas_cancha/reserva_participantes.

drop policy if exists "reservas_lectura_participante" on public.reservas_cancha;
create policy "reservas_lectura_participante"
  on public.reservas_cancha for select
  to authenticated
  using (
    exists (
      select 1
      from public.reserva_participantes rp
      where rp.reserva_id = reservas_cancha.id
        and rp.user_id = auth.uid()
    )
  );

drop policy if exists "participantes_lectura_propia" on public.reserva_participantes;
create policy "participantes_lectura_propia"
  on public.reserva_participantes for select
  to authenticated
  using (user_id = auth.uid());
