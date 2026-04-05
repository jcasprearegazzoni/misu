create or replace function public.get_available_courts(
  p_club_id integer,
  p_deporte text,
  p_fecha date,
  p_hora time,
  p_duracion integer
)
returns table (
  cancha_id integer,
  cancha_nombre text,
  hora_fin time,
  precio numeric
)
language sql
security definer
set search_path = public
as $$
  select
    s.cancha_id,
    s.cancha_nombre,
    s.hora_fin,
    s.precio
  from public.get_club_slots_disponibles(p_club_id, p_deporte, p_fecha) s
  where s.hora_inicio = p_hora
    and s.duracion_minutos = p_duracion
  order by s.cancha_nombre;
$$;

revoke all on function public.get_available_courts(integer, text, date, time, integer) from public;
grant execute on function public.get_available_courts(integer, text, date, time, integer) to anon, authenticated;
