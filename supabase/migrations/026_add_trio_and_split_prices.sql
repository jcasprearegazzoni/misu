-- =========================================================
-- A) PRECIOS EN PROFILES
-- =========================================================
alter table public.profiles
  add column if not exists price_dobles numeric(10,2),
  add column if not exists price_trio numeric(10,2);

-- Migración segura:
-- Si ya había un valor general en price_grupal, lo copiamos a dobles y trio
-- solo cuando esos campos nuevos están vacíos.
update public.profiles
set
  price_dobles = coalesce(price_dobles, price_grupal),
  price_trio = coalesce(price_trio, price_grupal)
where price_grupal is not null;

-- Constraints básicas de no negativo
alter table public.profiles
  drop constraint if exists profiles_price_dobles_non_negative;

alter table public.profiles
  add constraint profiles_price_dobles_non_negative
  check (price_dobles is null or price_dobles >= 0);

alter table public.profiles
  drop constraint if exists profiles_price_trio_non_negative;

alter table public.profiles
  add constraint profiles_price_trio_non_negative
  check (price_trio is null or price_trio >= 0);

-- =========================================================
-- B) BOOKING TYPE: agregar trio
-- =========================================================
alter table public.bookings
  drop constraint if exists bookings_type_check;

alter table public.bookings
  add constraint bookings_type_check
  check (type in ('individual', 'dobles', 'trio', 'grupal'));

-- =========================================================
-- C) RPC DE RESERVA CON CAPACIDAD (incluye trio=3)
-- =========================================================
drop function if exists public.reserve_booking_with_capacity(uuid, uuid, date, time, time, text);

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
begin
  if p_type not in ('individual', 'dobles', 'trio', 'grupal') then
    raise exception 'Tipo de clase invalido.';
  end if;

  -- Lock por slot para evitar sobreventa
  v_lock_key := hashtextextended(
    p_profesor_id::text || '|' || p_date::text || '|' || p_start_time::text || '|' || p_end_time::text,
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  -- Evitar doble reserva activa del mismo alumno en el mismo slot
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
    p_type,
    'pendiente'
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.reserve_booking_with_capacity(uuid, uuid, date, time, time, text) from public;
revoke all on function public.reserve_booking_with_capacity(uuid, uuid, date, time, time, text) from anon;
grant execute on function public.reserve_booking_with_capacity(uuid, uuid, date, time, time, text) to authenticated;

-- =========================================================
-- D) SOLO DECISIONS: incluir trio
-- =========================================================
create or replace function public.create_pending_solo_decisions(
  p_cutoff_hours int default 24,
  p_deadline_minutes int default 1440
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created int := 0;
begin
  with active_slots as (
    select
      b.profesor_id,
      b.date,
      b.start_time,
      b.end_time,
      count(*) as active_count
    from public.bookings b
    where b.status in ('pendiente', 'confirmado')
      and b.type in ('dobles', 'trio', 'grupal')
    group by b.profesor_id, b.date, b.start_time, b.end_time
    having count(*) = 1
  ),
  candidate_bookings as (
    select
      b.id,
      b.profesor_id,
      b.alumno_id,
      (b.date::timestamp + b.start_time)::timestamptz as slot_start_at
    from public.bookings b
    join active_slots s
      on s.profesor_id = b.profesor_id
     and s.date = b.date
     and s.start_time = b.start_time
     and s.end_time = b.end_time
    where b.status in ('pendiente', 'confirmado')
      and b.type in ('dobles', 'trio', 'grupal')
  ),
  inserted as (
    insert into public.booking_solo_decisions (
      booking_id,
      profesor_id,
      alumno_id,
      status,
      decision_deadline_at
    )
    select
      c.id,
      c.profesor_id,
      c.alumno_id,
      'pendiente',
      now() + make_interval(mins => p_deadline_minutes)
    from candidate_bookings c
    where c.slot_start_at >= now()
      and c.slot_start_at <= now() + make_interval(hours => p_cutoff_hours)
      and not exists (
        select 1
        from public.booking_solo_decisions d
        where d.booking_id = c.id
          and d.status = 'pendiente'
      )
    returning id
  )
  select count(*) into v_created from inserted;

  return v_created;
end;
$$;

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

  select b.id, b.alumno_id
    into v_booking_id, v_alumno_id
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.date = p_date
    and b.start_time = p_start_time
    and b.end_time = p_end_time
    and b.status in ('pendiente', 'confirmado')
  limit 1;

  if not exists (
    select 1 from public.bookings
    where id = v_booking_id
      and type in ('dobles', 'trio', 'grupal')
  ) then
    return false;
  end if;

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
