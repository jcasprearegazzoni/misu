-- Evita recursion infinita de RLS entre reservas_cancha y reserva_participantes.
-- Estrategia: mover validaciones cruzadas a funciones SECURITY DEFINER.

create or replace function public.is_club_owner_of_reserva(p_reserva_id integer)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reservas_cancha rc
    join public.clubs c on c.id = rc.club_id
    where rc.id = p_reserva_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.is_participante_de_reserva(p_reserva_id integer)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reserva_participantes rp
    where rp.reserva_id = p_reserva_id
      and rp.user_id = auth.uid()
  );
$$;

revoke all on function public.is_club_owner_of_reserva(integer) from public;
revoke all on function public.is_participante_de_reserva(integer) from public;
grant execute on function public.is_club_owner_of_reserva(integer) to authenticated;
grant execute on function public.is_participante_de_reserva(integer) to authenticated;

drop policy if exists "participantes_lectura_club" on public.reserva_participantes;
create policy "participantes_lectura_club"
  on public.reserva_participantes for select
  to authenticated
  using (public.is_club_owner_of_reserva(reserva_id));

drop policy if exists "reservas_lectura_participante" on public.reservas_cancha;
create policy "reservas_lectura_participante"
  on public.reservas_cancha for select
  to authenticated
  using (public.is_participante_de_reserva(id));
