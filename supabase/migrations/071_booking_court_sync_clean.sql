-- Flujo limpio clase->cancha: sincroniza bookings confirmados con reservas_cancha.
-- Baseline: mantiene 069 y 070, y centraliza la logica critica en DB.

alter table public.reservas_cancha
  add column if not exists booking_id bigint references public.bookings(id) on delete set null;

create index if not exists reservas_cancha_booking_id_idx
  on public.reservas_cancha (booking_id);

create unique index if not exists reservas_cancha_booking_clase_unique
  on public.reservas_cancha (booking_id)
  where booking_id is not null and tipo = 'clase';

create or replace function public.cancel_booking_class_reservation(
  p_booking_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reservas_cancha
  set estado = 'cancelada'
  where booking_id = p_booking_id
    and tipo = 'clase'
    and estado <> 'cancelada';
end;
$$;

revoke all on function public.cancel_booking_class_reservation(bigint) from public;
revoke all on function public.cancel_booking_class_reservation(bigint) from anon;
revoke all on function public.cancel_booking_class_reservation(bigint) from authenticated;

create or replace function public.sync_booking_class_reservation(
  p_booking_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
  v_duration_min integer;
begin
  select
    b.id,
    b.profesor_id,
    b.club_id,
    b.cancha_id,
    b.date,
    b.start_time,
    b.end_time,
    b.status,
    c.deporte
  into v_booking
  from public.bookings b
  left join public.canchas c
    on c.id = b.cancha_id
  where b.id = p_booking_id;

  if not found then
    return;
  end if;

  if v_booking.status <> 'confirmado'
     or v_booking.club_id is null
     or v_booking.cancha_id is null
     or v_booking.deporte is null then
    perform public.cancel_booking_class_reservation(p_booking_id);
    return;
  end if;

  v_duration_min := (
    extract(
      epoch
      from (
        (timestamp '2000-01-01' + v_booking.end_time + case when v_booking.end_time <= v_booking.start_time then interval '1 day' else interval '0' end)
        - (timestamp '2000-01-01' + v_booking.start_time)
      )
    ) / 60
  )::int;

  if v_duration_min <= 0 then
    raise exception 'Duracion invalida para booking %.', p_booking_id;
  end if;

  update public.reservas_cancha
  set
    club_id = v_booking.club_id,
    cancha_id = v_booking.cancha_id,
    deporte = v_booking.deporte,
    fecha = v_booking.date,
    hora_inicio = v_booking.start_time,
    duracion_minutos = v_duration_min,
    estado = 'confirmada',
    tipo = 'clase',
    profesor_id = v_booking.profesor_id,
    confirmacion_auto = true
  where booking_id = p_booking_id
    and tipo = 'clase';

  if found then
    return;
  end if;

  insert into public.reservas_cancha (
    club_id,
    cancha_id,
    deporte,
    fecha,
    hora_inicio,
    duracion_minutos,
    estado,
    tipo,
    profesor_id,
    confirmacion_auto,
    booking_id
  )
  values (
    v_booking.club_id,
    v_booking.cancha_id,
    v_booking.deporte,
    v_booking.date,
    v_booking.start_time,
    v_duration_min,
    'confirmada',
    'clase',
    v_booking.profesor_id,
    true,
    p_booking_id
  );
end;
$$;

revoke all on function public.sync_booking_class_reservation(bigint) from public;
revoke all on function public.sync_booking_class_reservation(bigint) from anon;
revoke all on function public.sync_booking_class_reservation(bigint) from authenticated;

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
    b.cancha_id
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

  if v_booking.club_id is null then
    update public.bookings
    set
      status = 'confirmado',
      cancha_id = null
    where id = v_booking.id;
    return true;
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
    raise exception 'No hay canchas disponibles en este horario para confirmar la clase.';
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
    b.cancha_id
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
      raise exception 'No hay canchas disponibles en este horario para reprogramar la clase confirmada.';
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

create or replace function public.before_release_booking_court_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.status = 'cancelado'
     and old.status is distinct from new.status then
    new.cancha_id := null;
  end if;

  return new;
end;
$$;

revoke all on function public.before_release_booking_court_on_cancel() from public;
revoke all on function public.before_release_booking_court_on_cancel() from anon;
revoke all on function public.before_release_booking_court_on_cancel() from authenticated;

drop trigger if exists trg_before_release_booking_court_on_cancel on public.bookings;
create trigger trg_before_release_booking_court_on_cancel
before update of status on public.bookings
for each row
execute function public.before_release_booking_court_on_cancel();

create or replace function public.after_sync_booking_class_reservation_on_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelado' then
    perform public.cancel_booking_class_reservation(new.id);
  elsif new.status = 'confirmado' then
    perform public.sync_booking_class_reservation(new.id);
  elsif old.status = 'confirmado' and new.status <> 'confirmado' then
    perform public.cancel_booking_class_reservation(new.id);
  end if;

  return new;
end;
$$;

revoke all on function public.after_sync_booking_class_reservation_on_booking_update() from public;
revoke all on function public.after_sync_booking_class_reservation_on_booking_update() from anon;
revoke all on function public.after_sync_booking_class_reservation_on_booking_update() from authenticated;

drop trigger if exists trg_after_sync_booking_class_reservation_on_booking_update on public.bookings;
create trigger trg_after_sync_booking_class_reservation_on_booking_update
after update of status, club_id, cancha_id, date, start_time, end_time on public.bookings
for each row
when (old.* is distinct from new.*)
execute function public.after_sync_booking_class_reservation_on_booking_update();

do $$
declare
  v_booking record;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  for v_booking in
    select b.id
    from public.bookings b
    join public.canchas c
      on c.id = b.cancha_id
     and c.club_id = b.club_id
    where b.status = 'confirmado'
      and b.club_id is not null
      and b.cancha_id is not null
      and b.date >= v_today
  loop
    perform public.sync_booking_class_reservation(v_booking.id);
  end loop;
end;
$$;
