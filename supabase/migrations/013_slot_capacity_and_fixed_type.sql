drop index if exists public.bookings_unique_active_slot_idx;
create index if not exists bookings_active_slot_lookup_idx
  on public.bookings (profesor_id, date, start_time, end_time)
  where status in ('pendiente', 'confirmado');

-- Mejora futura: validar que el slot pertenezca a availability para ese profesor.
create or replace function public.reserve_booking_with_capacity(
  p_profesor_id uuid,
  p_alumno_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_type text
)
returns table (
  booking_id bigint,
  slot_type text,
  active_count int,
  capacity int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_type text;
  v_active_count int;
  v_capacity int;
  v_lock_key text;
begin
  if p_type not in ('individual', 'dobles', 'grupal') then
    raise exception 'Tipo invalido';
  end if;

  if p_start_time >= p_end_time then
    raise exception 'Rango horario invalido';
  end if;

  -- Lock transaccional por slot para evitar sobreventa en concurrencia.
  v_lock_key := p_profesor_id::text || '|' || p_date::text || '|' || p_start_time::text || '|' || p_end_time::text;
  perform pg_advisory_xact_lock(hashtext(v_lock_key));

  -- Evita doble reserva activa del mismo alumno para el mismo slot.
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

  select b.type
    into v_existing_type
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_date
    and b.start_time = p_start_time
    and b.end_time = p_end_time
    and b.status in ('pendiente', 'confirmado')
  group by b.type
  order by b.type
  limit 1;

  if v_existing_type is not null and v_existing_type <> p_type then
    raise exception 'Este slot ya tiene modalidad fija: %', v_existing_type;
  end if;

  if coalesce(v_existing_type, p_type) = 'individual' then
    v_capacity := 1;
  elsif coalesce(v_existing_type, p_type) = 'dobles' then
    v_capacity := 2;
  else
    v_capacity := 4;
  end if;

  select count(*)
    into v_active_count
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_date
    and b.start_time = p_start_time
    and b.end_time = p_end_time
    and b.status in ('pendiente', 'confirmado');

  if v_active_count >= v_capacity then
    raise exception 'Este slot ya alcanzo su capacidad (%).', v_capacity;
  end if;

  insert into public.bookings (
    profesor_id,
    alumno_id,
    date,
    start_time,
    end_time,
    type,
    status
  )
  values (
    p_profesor_id,
    p_alumno_id,
    p_date,
    p_start_time,
    p_end_time,
    coalesce(v_existing_type, p_type),
    'pendiente'
  )
  returning id into booking_id;

  slot_type := coalesce(v_existing_type, p_type);
  active_count := v_active_count + 1;
  capacity := v_capacity;
  return next;
end;
$$;

revoke all on function public.reserve_booking_with_capacity(uuid, uuid, date, time, time, text) from public;
grant execute on function public.reserve_booking_with_capacity(uuid, uuid, date, time, time, text) to authenticated;

create or replace function public.get_active_slot_occupancy(
  p_profesor_id uuid,
  p_date_from date,
  p_date_to date
)
returns table (
  date date,
  start_time time,
  end_time time,
  type text,
  active_count int
)
language sql
security definer
set search_path = public
as $$
  select
    b.date,
    b.start_time,
    b.end_time,
    b.type,
    count(*)::int as active_count
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.status in ('pendiente', 'confirmado')
    and b.date between p_date_from and p_date_to
  group by b.date, b.start_time, b.end_time, b.type
  order by b.date, b.start_time;
$$;

revoke all on function public.get_active_slot_occupancy(uuid, date, date) from public;
grant execute on function public.get_active_slot_occupancy(uuid, date, date) to authenticated;
