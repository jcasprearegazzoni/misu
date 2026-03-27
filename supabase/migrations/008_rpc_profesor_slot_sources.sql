create or replace function public.get_profesor_weekly_availability(
  p_profesor_id uuid
)
returns table (
  day_of_week smallint,
  start_time time,
  end_time time,
  slot_duration_minutes integer
)
language sql
security definer
set search_path = public
as $$
  select
    a.day_of_week,
    a.start_time,
    a.end_time,
    a.slot_duration_minutes
  from public.availability a
  where a.profesor_id = p_profesor_id
  order by a.day_of_week, a.start_time;
$$;

revoke all on function public.get_profesor_weekly_availability(uuid) from public;
grant execute on function public.get_profesor_weekly_availability(uuid) to authenticated;

create or replace function public.get_profesor_blocked_ranges(
  p_profesor_id uuid,
  p_date_from date,
  p_date_to date
)
returns table (
  start_at timestamptz,
  end_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    b.start_at,
    b.end_at
  from public.blocked_dates b
  where b.profesor_id = p_profesor_id
    and b.start_at < (p_date_to::timestamp + interval '1 day')
    and b.end_at >= p_date_from::timestamp
  order by b.start_at;
$$;

revoke all on function public.get_profesor_blocked_ranges(uuid, date, date) from public;
grant execute on function public.get_profesor_blocked_ranges(uuid, date, date) to authenticated;
