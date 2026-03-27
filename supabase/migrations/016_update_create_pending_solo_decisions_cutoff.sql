drop function if exists public.create_pending_solo_decisions(int);

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
      and b.type in ('dobles', 'grupal')
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

revoke all on function public.create_pending_solo_decisions(int, int) from public;
revoke all on function public.create_pending_solo_decisions(int, int) from anon;
revoke all on function public.create_pending_solo_decisions(int, int) from authenticated;
grant execute on function public.create_pending_solo_decisions(int, int) to service_role;
