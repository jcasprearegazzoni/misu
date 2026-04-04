create or replace function public.get_club_slots_disponibles(
  p_club_id integer,
  p_deporte text,
  p_fecha date
)
returns table (
  cancha_id integer,
  cancha_nombre text,
  hora_inicio time,
  hora_fin time,
  duracion_minutos integer,
  precio numeric
)
language sql
security definer
set search_path = public
as $$
  with ventanas as (
    select
      d.club_id,
      d.deporte,
      d.day_of_week,
      d.duraciones,
      c.id as cancha_id,
      c.nombre as cancha_nombre,
      fp.duracion_minutos,
      fp.precio,
      (extract(hour from d.apertura)::int * 60 + extract(minute from d.apertura)::int) as apertura_min,
      (
        case
          when d.cierre = time '23:59' then 1440
          else extract(hour from d.cierre)::int * 60 + extract(minute from d.cierre)::int
        end
      ) as cierre_min,
      (extract(hour from fp.desde)::int * 60 + extract(minute from fp.desde)::int) as franja_desde_min,
      (
        case
          when fp.hasta = time '23:59' then 1440
          else extract(hour from fp.hasta)::int * 60 + extract(minute from fp.hasta)::int
        end
      ) as franja_hasta_min
    from public.club_disponibilidad d
    join public.canchas c
      on c.club_id = d.club_id
     and c.deporte = d.deporte
     and c.activa = true
    join public.club_franjas_precio fp
      on fp.club_id = d.club_id
     and fp.deporte = d.deporte
     and fp.day_of_week = d.day_of_week
    where d.club_id = p_club_id
      and d.deporte = p_deporte
      and d.day_of_week = extract(dow from p_fecha)::smallint
      and fp.duracion_minutos = any(d.duraciones)
  ),
  slots_base as (
    select
      v.cancha_id,
      v.cancha_nombre,
      v.duracion_minutos,
      v.precio,
      (v.apertura_min + (series.n * v.duracion_minutos)) as slot_inicio_min,
      (v.apertura_min + ((series.n + 1) * v.duracion_minutos)) as slot_fin_min
    from ventanas v
    cross join lateral generate_series(
      0,
      floor((v.cierre_min - v.apertura_min)::numeric / v.duracion_minutos::numeric)::int - 1
    ) as series(n)
    where v.cierre_min > v.apertura_min
      and (v.apertura_min + (series.n * v.duracion_minutos)) >= v.franja_desde_min
      and (v.apertura_min + (series.n * v.duracion_minutos)) < v.franja_hasta_min
  ),
  slots as (
    select
      sb.cancha_id,
      sb.cancha_nombre,
      make_time((sb.slot_inicio_min / 60) % 24, sb.slot_inicio_min % 60, 0) as hora_inicio,
      make_time((sb.slot_fin_min / 60) % 24, sb.slot_fin_min % 60, 0) as hora_fin,
      sb.duracion_minutos,
      sb.precio,
      (p_fecha + make_time((sb.slot_inicio_min / 60) % 24, sb.slot_inicio_min % 60, 0)) as slot_inicio_ts,
      (
        p_fecha
        + make_time((sb.slot_fin_min / 60) % 24, sb.slot_fin_min % 60, 0)
        + case when make_time((sb.slot_fin_min / 60) % 24, sb.slot_fin_min % 60, 0) <= make_time((sb.slot_inicio_min / 60) % 24, sb.slot_inicio_min % 60, 0)
          then interval '1 day'
          else interval '0'
          end
      ) as slot_fin_ts
    from slots_base sb
  )
  select
    s.cancha_id,
    s.cancha_nombre,
    s.hora_inicio,
    s.hora_fin,
    s.duracion_minutos,
    s.precio
  from slots s
  where not exists (
    select 1
    from public.reservas_cancha r
    where r.cancha_id = s.cancha_id
      and r.fecha = p_fecha
      and r.estado in ('pendiente', 'confirmada')
      and tsrange(
        (r.fecha + r.hora_inicio),
        (
          r.fecha
          + r.hora_fin
          + case when r.hora_fin <= r.hora_inicio then interval '1 day' else interval '0' end
        ),
        '[)'
      ) && tsrange(s.slot_inicio_ts, s.slot_fin_ts, '[)')
  )
  order by s.cancha_nombre, s.hora_inicio, s.duracion_minutos;
$$;

revoke all on function public.get_club_slots_disponibles(integer, text, date) from public;
grant execute on function public.get_club_slots_disponibles(integer, text, date) to anon, authenticated;
