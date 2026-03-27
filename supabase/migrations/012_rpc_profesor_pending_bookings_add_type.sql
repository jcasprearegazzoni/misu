create or replace function public.get_profesor_pending_bookings(
  p_profesor_id uuid
)
returns table (
  id bigint,
  alumno_id uuid,
  alumno_name text,
  date date,
  start_time time,
  end_time time,
  type text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    b.id,
    b.alumno_id,
    p.name as alumno_name,
    b.date,
    b.start_time,
    b.end_time,
    b.type,
    b.status,
    b.created_at
  from public.bookings b
  left join public.profiles p on p.user_id = b.alumno_id
  where b.profesor_id = p_profesor_id
    and b.status = 'pendiente'
  order by b.date, b.start_time;
$$;

revoke all on function public.get_profesor_pending_bookings(uuid) from public;
grant execute on function public.get_profesor_pending_bookings(uuid) to authenticated;
