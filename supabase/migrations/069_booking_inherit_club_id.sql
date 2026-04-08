-- Actualiza el RPC reserve_booking_with_capacity para heredar club_id
-- de la franja de disponibilidad del profesor que corresponde al slot reservado.

create or replace function public.reserve_booking_with_capacity(
  p_profesor_id uuid,
  p_alumno_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_type text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id bigint;
  v_existing_type text;
  v_active_count int;
  v_capacity int;
  v_lock_key bigint;
  v_club_id integer;
  v_day_of_week smallint;
begin
  if p_type not in ('individual', 'dobles', 'trio', 'grupal') then
    raise exception 'Tipo de clase invalido.';
  end if;

  v_lock_key := hashtextextended(
    p_profesor_id::text || '|' || p_date::text || '|' || p_start_time::text || '|' || p_end_time::text,
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  if exists (
    select 1
    from public.bookings b
    where b.profesor_id = p_profesor_id
      and b.alumno_id = p_alumno_id
      and b.date = p_date
      and b.start_time = p_start_time
      and b.end_time = p_end_time
      and b.status in ('pendiente', 'confirmado')
  ) then
    raise exception 'Ya tienes una reserva activa en este horario.';
  end if;

  select b.type, count(*)::int
    into v_existing_type, v_active_count
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_date
    and b.start_time = p_start_time
    and b.end_time = p_end_time
    and b.status in ('pendiente', 'confirmado')
  group by b.type
  order by count(*) desc
  limit 1;

  if v_existing_type is null then
    v_existing_type := p_type;
    v_active_count := 0;
  end if;

  if p_type <> v_existing_type then
    raise exception 'El slot ya tiene modalidad fija: %', v_existing_type;
  end if;

  v_capacity := case v_existing_type
    when 'individual' then 1
    when 'dobles' then 2
    when 'trio' then 3
    when 'grupal' then 4
    else 0
  end;

  if v_active_count >= v_capacity then
    raise exception 'No hay cupos disponibles para este slot.';
  end if;

  -- Heredar club_id de la franja de disponibilidad que corresponde al slot
  v_day_of_week := extract(dow from p_date)::smallint;
  select a.club_id into v_club_id
  from public.availability a
  where a.profesor_id = p_profesor_id
    and a.day_of_week = v_day_of_week
    and a.start_time <= p_start_time
    and a.end_time >= p_end_time
  limit 1;

  insert into public.bookings (
    profesor_id,
    alumno_id,
    date,
    start_time,
    end_time,
    type,
    status,
    club_id
  )
  values (
    p_profesor_id,
    p_alumno_id,
    p_date,
    p_start_time,
    p_end_time,
    p_type,
    'pendiente',
    v_club_id  -- null si la franja no tiene club asignado
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;
