create or replace function public.try_create_solo_decision_for_slot(
  p_profesor_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_deadline_minutes int default 1440
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id bigint;
  v_alumno_id uuid;
  v_count int;
begin
  -- contar activos en el slot
  select count(*) into v_count
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_date
    and b.start_time = p_start_time
    and b.end_time = p_end_time
    and b.status in ('pendiente', 'confirmado');

  if v_count <> 1 then
    return false;
  end if;

  -- obtener booking único
  select b.id, b.alumno_id
    into v_booking_id, v_alumno_id
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_date
    and b.start_time = p_start_time
    and b.end_time = p_end_time
    and b.status in ('pendiente', 'confirmado')
  limit 1;

  -- validar tipo
  if not exists (
    select 1 from public.bookings
    where id = v_booking_id
      and type in ('dobles', 'grupal')
  ) then
    return false;
  end if;

  -- evitar duplicado
  if exists (
    select 1
    from public.booking_solo_decisions d
    where d.booking_id = v_booking_id
      and d.status = 'pendiente'
  ) then
    return false;
  end if;

  insert into public.booking_solo_decisions (
    booking_id,
    profesor_id,
    alumno_id,
    status,
    decision_deadline_at
  )
  values (
    v_booking_id,
    p_profesor_id,
    v_alumno_id,
    'pendiente',
    now() + make_interval(mins => p_deadline_minutes)
  );

  return true;
end;
$$;

revoke all on function public.try_create_solo_decision_for_slot(uuid, date, time, time, int) from public;
revoke all on function public.try_create_solo_decision_for_slot(uuid, date, time, time, int) from anon;
revoke all on function public.try_create_solo_decision_for_slot(uuid, date, time, time, int) from authenticated;
grant execute on function public.try_create_solo_decision_for_slot(uuid, date, time, time, int) to service_role;
