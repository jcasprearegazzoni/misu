-- Vincula cada franja de disponibilidad a un club específico.
-- club_id nullable: NULL significa que la clase es "Particular" (sin club).

alter table public.availability
  add column club_id integer references public.clubs(id) on delete set null;

-- Reemplaza la función para incluir club_id y nombre del club.
drop function if exists public.get_profesor_weekly_availability(uuid);

create function public.get_profesor_weekly_availability(
  p_profesor_id uuid
)
returns table (
  day_of_week smallint,
  start_time time,
  end_time time,
  slot_duration_minutes integer,
  club_id integer,
  club_nombre text
)
language sql
security definer
set search_path = public
as $$
  select
    a.day_of_week,
    a.start_time,
    a.end_time,
    a.slot_duration_minutes,
    a.club_id,
    c.nombre as club_nombre
  from public.availability a
  left join public.clubs c on c.id = a.club_id
  where a.profesor_id = p_profesor_id
  order by a.day_of_week, a.start_time;
$$;

revoke all on function public.get_profesor_weekly_availability(uuid) from public;
grant execute on function public.get_profesor_weekly_availability(uuid) to authenticated;
