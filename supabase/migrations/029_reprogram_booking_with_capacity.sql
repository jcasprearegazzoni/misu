alter table public.booking_solo_decisions
  drop constraint if exists booking_solo_decisions_status_check;

alter table public.booking_solo_decisions
  add constraint booking_solo_decisions_status_check
  check (
    status in (
      'pendiente',
      'aceptada_individual',
      'cancelada_alumno',
      'cancelada_timeout',
      'cancelada_reprogramacion'
    )
  );

drop function if exists public.reprogram_booking_with_capacity(bigint, uuid, date, time, time);

create or replace function public.reprogram_booking_with_capacity(
  p_booking_id bigint,
  p_profesor_id uuid,
  p_new_date date,
  p_new_start_time time,
  p_new_end_time time
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
  v_existing_type text;
  v_active_count int;
  v_capacity int;
  v_lock_key bigint;
  v_new_day_of_week int;
  v_new_start_at timestamptz;
  v_new_end_at timestamptz;
begin
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para reprogramar esta clase.';
  end if;

  if p_new_start_time >= p_new_end_time then
    raise exception 'La hora de inicio debe ser menor que la hora de fin.';
  end if;

  select
    b.id,
    b.profesor_id,
    b.alumno_id,
    b.date,
    b.start_time,
    b.end_time,
    b.type,
    b.status
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.profesor_id = p_profesor_id
  for update;

  if v_booking.id is null then
    raise exception 'Booking no encontrado.';
  end if;

  if v_booking.status not in ('pendiente', 'confirmado') then
    raise exception 'Solo se pueden reprogramar clases pendientes o confirmadas.';
  end if;

  if v_booking.date = p_new_date
     and v_booking.start_time = p_new_start_time
     and v_booking.end_time = p_new_end_time then
    return true;
  end if;

  -- Lock por slot destino para evitar sobreventa por concurrencia.
  v_lock_key := hashtextextended(
    p_profesor_id::text || '|' || p_new_date::text || '|' || p_new_start_time::text || '|' || p_new_end_time::text,
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  -- Evitar doble booking activo del mismo alumno en el slot destino.
  if exists (
    select 1
    from public.bookings b
    where b.profesor_id = p_profesor_id
      and b.alumno_id = v_booking.alumno_id
      and b.date = p_new_date
      and b.start_time = p_new_start_time
      and b.end_time = p_new_end_time
      and b.status in ('pendiente', 'confirmado')
      and b.id <> p_booking_id
  ) then
    raise exception 'El alumno ya tiene una clase activa en ese horario.';
  end if;

  -- Validar que el nuevo slot exista en availability y respete duracion/alineacion.
  v_new_day_of_week := extract(dow from p_new_date)::int;
  if not exists (
    select 1
    from public.availability a
    where a.profesor_id = p_profesor_id
      and a.day_of_week = v_new_day_of_week
      and a.start_time <= p_new_start_time
      and a.end_time >= p_new_end_time
      and (extract(epoch from (p_new_end_time - p_new_start_time)) / 60)::int = a.slot_duration_minutes
      and mod(
        (extract(epoch from (p_new_start_time - a.start_time)) / 60)::int,
        a.slot_duration_minutes
      ) = 0
  ) then
    raise exception 'El horario elegido no coincide con la disponibilidad del profesor.';
  end if;

  -- Validar bloqueos/ausencias.
  v_new_start_at := timezone('America/Argentina/Buenos_Aires', p_new_date::timestamp + p_new_start_time);
  v_new_end_at := timezone('America/Argentina/Buenos_Aires', p_new_date::timestamp + p_new_end_time);
  if exists (
    select 1
    from public.blocked_dates bd
    where bd.profesor_id = p_profesor_id
      and v_new_start_at < bd.end_at
      and v_new_end_at > bd.start_at
  ) then
    raise exception 'El horario elegido esta bloqueado por una ausencia.';
  end if;

  -- Modalidad fija y cupo del slot destino.
  select b.type, count(*)::int
    into v_existing_type, v_active_count
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_new_date
    and b.start_time = p_new_start_time
    and b.end_time = p_new_end_time
    and b.status in ('pendiente', 'confirmado')
    and b.id <> p_booking_id
  group by b.type
  order by count(*) desc
  limit 1;

  if v_existing_type is null then
    v_existing_type := v_booking.type;
    v_active_count := 0;
  end if;

  if v_existing_type <> v_booking.type then
    raise exception 'El nuevo slot ya tiene modalidad fija: %', v_existing_type;
  end if;

  v_capacity := case v_existing_type
    when 'individual' then 1
    when 'dobles' then 2
    when 'trio' then 3
    when 'grupal' then 4
    else 0
  end;

  if v_active_count >= v_capacity then
    raise exception 'No hay cupos disponibles en el nuevo horario.';
  end if;

  update public.bookings
  set
    date = p_new_date,
    start_time = p_new_start_time,
    end_time = p_new_end_time
  where id = p_booking_id;

  -- Si habia decision pendiente para este booking, ya no aplica al cambiar de slot.
  update public.booking_solo_decisions d
  set
    status = 'cancelada_reprogramacion',
    responded_at = now()
  where d.booking_id = p_booking_id
    and d.status = 'pendiente';

  -- El slot original puede haber quedado con un solo alumno: intentar crear decision.
  perform public.try_create_solo_decision_for_slot(
    v_booking.profesor_id,
    v_booking.date,
    v_booking.start_time,
    v_booking.end_time
  );

  return true;
end;
$$;

revoke all on function public.reprogram_booking_with_capacity(bigint, uuid, date, time, time) from public;
revoke all on function public.reprogram_booking_with_capacity(bigint, uuid, date, time, time) from anon;
grant execute on function public.reprogram_booking_with_capacity(bigint, uuid, date, time, time) to authenticated;
