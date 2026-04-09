-- Fix: la selección de cancha ahora filtra por deporte del booking.
-- Antes se elegía cualquier cancha activa del club sin importar el deporte,
-- lo que podía asignar una cancha de tenis a una clase de pádel.

create or replace function public.confirm_booking_with_court(
  p_booking_id bigint,
  p_profesor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
  v_cancha_id integer;
  v_lock_key bigint;
begin
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para confirmar esta clase.';
  end if;

  select
    b.id,
    b.profesor_id,
    b.club_id,
    b.date,
    b.start_time,
    b.end_time,
    b.status,
    b.cancha_id,
    b.sport
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.profesor_id = p_profesor_id
  for update;

  if not found then
    raise exception 'Booking no encontrado.';
  end if;

  if v_booking.status = 'cancelado' then
    raise exception 'No se puede confirmar una clase cancelada.';
  end if;

  if v_booking.status = 'confirmado' then
    if v_booking.club_id is null then
      return true;
    end if;

    if v_booking.cancha_id is null then
      raise exception 'La clase ya esta confirmada, pero no tiene cancha asignada.';
    end if;

    perform public.sync_booking_class_reservation(v_booking.id);
    return true;
  end if;

  -- Clase particular: confirmar sin asignar cancha.
  if v_booking.club_id is null then
    update public.bookings
    set
      status = 'confirmado',
      cancha_id = null
    where id = v_booking.id;
    return true;
  end if;

  -- Clase en club: requiere deporte definido para asignar cancha correcta.
  if v_booking.sport is null then
    raise exception 'La clase no tiene deporte asignado. No se puede asignar una cancha.';
  end if;

  v_lock_key := hashtextextended(
    v_booking.club_id::text || '|' || v_booking.date::text || '|' || v_booking.start_time::text || '|' || v_booking.end_time::text,
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  select c.id
  into v_cancha_id
  from public.canchas c
  where c.club_id = v_booking.club_id
    and c.activa = true
    and c.deporte = v_booking.sport
    and not exists (
      select 1
      from public.reservas_cancha r
      where r.club_id = v_booking.club_id
        and r.cancha_id = c.id
        and r.estado in ('pendiente', 'confirmada')
        and r.fecha = v_booking.date
        and r.hora_inicio < v_booking.end_time
        and r.hora_fin > v_booking.start_time
    )
    and not exists (
      select 1
      from public.bookings b
      where b.club_id = v_booking.club_id
        and b.status = 'confirmado'
        and b.id <> v_booking.id
        and b.cancha_id = c.id
        and b.date = v_booking.date
        and b.start_time < v_booking.end_time
        and b.end_time > v_booking.start_time
    )
  order by c.id desc
  limit 1;

  if v_cancha_id is null then
    raise exception 'No hay canchas de % disponibles en este horario para confirmar la clase.', v_booking.sport;
  end if;

  update public.bookings
  set
    status = 'confirmado',
    cancha_id = v_cancha_id
  where id = v_booking.id;

  return true;
end;
$$;

revoke all on function public.confirm_booking_with_court(bigint, uuid) from public;
revoke all on function public.confirm_booking_with_court(bigint, uuid) from anon;
grant execute on function public.confirm_booking_with_court(bigint, uuid) to authenticated;

-- ----------------------------------------------------------------

create or replace function public.reprogram_booking_with_capacity(
  p_booking_id     bigint,
  p_profesor_id    uuid,
  p_new_date       date,
  p_new_start_time time,
  p_new_end_time   time,
  p_new_type       text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking         record;
  v_existing_type   text;
  v_effective_type  text;
  v_active_count    int;
  v_capacity        int;
  v_lock_key        bigint;
  v_new_day_of_week int;
  v_new_start_at    timestamptz;
  v_new_end_at      timestamptz;
  v_new_club_id     integer;
  v_new_cancha_id   integer;
  v_court_lock_key  bigint;
begin
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para reprogramar esta clase.';
  end if;

  if p_new_start_time >= p_new_end_time then
    raise exception 'La hora de inicio debe ser menor que la hora de fin.';
  end if;

  if p_new_type is not null and p_new_type not in ('individual', 'dobles', 'trio', 'grupal') then
    raise exception 'Modalidad invalida: %', p_new_type;
  end if;

  select
    b.id,
    b.profesor_id,
    b.alumno_id,
    b.date,
    b.start_time,
    b.end_time,
    b.type,
    b.status,
    b.club_id,
    b.cancha_id,
    b.sport
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
     and v_booking.end_time = p_new_end_time
     and (p_new_type is null or p_new_type = v_booking.type) then
    return true;
  end if;

  v_lock_key := hashtextextended(
    p_profesor_id::text || '|' || p_new_date::text || '|' || p_new_start_time::text || '|' || p_new_end_time::text,
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

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

  v_new_day_of_week := extract(dow from p_new_date)::int;

  select a.club_id
  into v_new_club_id
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
  order by a.start_time asc, a.id asc
  limit 1;

  if not found then
    raise exception 'El horario elegido no coincide con la disponibilidad del profesor.';
  end if;

  v_new_start_at := timezone('America/Argentina/Buenos_Aires', p_new_date::timestamp + p_new_start_time);
  v_new_end_at   := timezone('America/Argentina/Buenos_Aires', p_new_date::timestamp + p_new_end_time);

  if exists (
    select 1
    from public.blocked_dates bd
    where bd.profesor_id = p_profesor_id
      and v_new_start_at < bd.end_at
      and v_new_end_at > bd.start_at
  ) then
    raise exception 'El horario elegido esta bloqueado por una ausencia.';
  end if;

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
    v_effective_type := coalesce(p_new_type, v_booking.type);
    v_active_count := 0;
  else
    if p_new_type is not null and p_new_type <> v_existing_type then
      raise exception 'El nuevo slot ya tiene modalidad fija: %', v_existing_type;
    end if;

    v_effective_type := v_existing_type;
  end if;

  v_capacity := case v_effective_type
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
    end_time = p_new_end_time,
    type = v_effective_type,
    club_id = v_new_club_id,
    cancha_id = null
  where id = p_booking_id;

  if v_booking.status = 'confirmado' and v_new_club_id is not null then
    -- Clase confirmada en club: requiere deporte para asignar cancha correcta.
    if v_booking.sport is null then
      raise exception 'La clase no tiene deporte asignado. No se puede reasignar una cancha.';
    end if;

    v_court_lock_key := hashtextextended(
      v_new_club_id::text || '|' || p_new_date::text || '|' || p_new_start_time::text || '|' || p_new_end_time::text,
      0
    );
    perform pg_advisory_xact_lock(v_court_lock_key);

    select c.id
    into v_new_cancha_id
    from public.canchas c
    where c.club_id = v_new_club_id
      and c.activa = true
      and c.deporte = v_booking.sport
      and not exists (
        select 1
        from public.reservas_cancha r
        where r.club_id = v_new_club_id
          and r.cancha_id = c.id
          and r.estado in ('pendiente', 'confirmada')
          and r.fecha = p_new_date
          and r.hora_inicio < p_new_end_time
          and r.hora_fin > p_new_start_time
          and (r.booking_id is null or r.booking_id <> p_booking_id)
      )
      and not exists (
        select 1
        from public.bookings b
        where b.club_id = v_new_club_id
          and b.status = 'confirmado'
          and b.id <> p_booking_id
          and b.cancha_id = c.id
          and b.date = p_new_date
          and b.start_time < p_new_end_time
          and b.end_time > p_new_start_time
      )
    order by c.id desc
    limit 1;

    if v_new_cancha_id is null then
      raise exception 'No hay canchas de % disponibles en este horario para reprogramar la clase confirmada.', v_booking.sport;
    end if;

    update public.bookings
    set cancha_id = v_new_cancha_id
    where id = p_booking_id;
  end if;

  update public.booking_solo_decisions d
  set
    status = 'cancelada_reprogramacion',
    responded_at = now()
  where d.booking_id = p_booking_id
    and d.status = 'pendiente';

  perform public.try_create_solo_decision_for_slot(
    v_booking.profesor_id,
    v_booking.date,
    v_booking.start_time,
    v_booking.end_time
  );

  return true;
end;
$$;

revoke all on function public.reprogram_booking_with_capacity(bigint, uuid, date, time, time, text) from public;
revoke all on function public.reprogram_booking_with_capacity(bigint, uuid, date, time, time, text) from anon;
grant execute on function public.reprogram_booking_with_capacity(bigint, uuid, date, time, time, text) to authenticated;
