alter table public.booking_solo_decisions
  drop constraint if exists booking_solo_decisions_status_check;

alter table public.booking_solo_decisions
  add constraint booking_solo_decisions_status_check
  check (status in ('pendiente', 'aceptada_individual', 'cancelada_alumno', 'cancelada_timeout'));

-- Etapa actual: crea decision pendiente automaticamente solo cuando un slot
-- dobles/grupal queda con 1 booking activo. La ventana temporal de negocio
-- adicional se ajustara mas adelante.
create or replace function public.create_pending_solo_decisions(
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
      and b.type in ('dobles', 'grupal')
    group by b.profesor_id, b.date, b.start_time, b.end_time
    having count(*) = 1
  ),
  candidate_bookings as (
    select b.id, b.profesor_id, b.alumno_id
    from public.bookings b
    join active_slots s
      on s.profesor_id = b.profesor_id
     and s.date = b.date
     and s.start_time = b.start_time
     and s.end_time = b.end_time
    where b.status in ('pendiente', 'confirmado')
      and b.type in ('dobles', 'grupal')
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
    where not exists (
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

revoke all on function public.create_pending_solo_decisions(int) from public;
revoke all on function public.create_pending_solo_decisions(int) from anon;
revoke all on function public.create_pending_solo_decisions(int) from authenticated;
grant execute on function public.create_pending_solo_decisions(int) to service_role;

create or replace function public.resolve_expired_solo_decisions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int := 0;
begin
  with expired as (
    select d.id, d.booking_id
    from public.booking_solo_decisions d
    where d.status = 'pendiente'
      and d.decision_deadline_at is not null
      and d.decision_deadline_at <= now()
    for update skip locked
  ),
  updated_bookings as (
    update public.bookings b
    set status = 'cancelado'
    from expired e
    where b.id = e.booking_id
      and b.status in ('pendiente', 'confirmado')
    returning b.id
  ),
  updated_decisions as (
    update public.booking_solo_decisions d
    set status = 'cancelada_timeout',
        responded_at = now()
    from expired e
    where d.id = e.id
      and d.status = 'pendiente'
    returning d.id
  )
  select count(*) into v_updated from updated_decisions;

  return v_updated;
end;
$$;

revoke all on function public.resolve_expired_solo_decisions() from public;
revoke all on function public.resolve_expired_solo_decisions() from anon;
revoke all on function public.resolve_expired_solo_decisions() from authenticated;
grant execute on function public.resolve_expired_solo_decisions() to service_role;
