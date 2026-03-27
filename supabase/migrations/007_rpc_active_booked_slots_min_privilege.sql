drop policy if exists "Usuarios autenticados pueden ver slots reservados activos" on public.bookings;

create or replace function public.get_active_booked_slots(
  p_profesor_id uuid,
  p_date_from date,
  p_date_to date
)
returns table (
  date date,
  start_time time,
  end_time time
)
language sql
security definer
set search_path = public
as $$
  select
    b.date,
    b.start_time,
    b.end_time
  from public.bookings b
  where b.profesor_id = p_profesor_id
    and b.status in ('pendiente', 'confirmado')
    and b.date between p_date_from and p_date_to
  order by b.date, b.start_time;
$$;

revoke all on function public.get_active_booked_slots(uuid, date, date) from public;
grant execute on function public.get_active_booked_slots(uuid, date, date) to authenticated;
