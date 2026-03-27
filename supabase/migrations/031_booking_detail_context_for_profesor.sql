create or replace function public.get_profesor_booking_detail_context(
  p_profesor_id uuid,
  p_booking_id bigint
)
returns table (
  booking_id bigint,
  alumno_id uuid,
  alumno_name text,
  alumno_category text,
  alumno_branch text,
  alumno_zone text,
  alumno_has_equipment boolean,
  booking_type text,
  booking_status text,
  package_consumed boolean,
  consumed_student_package_id bigint,
  payment_covered boolean
)
language sql
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.alumno_id,
    coalesce(nullif(trim(p.name), ''), 'Alumno') as alumno_name,
    p.category as alumno_category,
    p.branch as alumno_branch,
    p.zone as alumno_zone,
    p.has_equipment as alumno_has_equipment,
    b.type as booking_type,
    b.status as booking_status,
    b.package_consumed,
    b.consumed_student_package_id,
    exists (
      select 1
      from public.payments pay
      where pay.profesor_id = p_profesor_id
        and pay.booking_id = b.id
        and pay.type in ('clase', 'seña', 'diferencia_cobro')
    ) as payment_covered
  from public.bookings b
  left join public.profiles p on p.user_id = b.alumno_id
  where b.profesor_id = p_profesor_id
    and b.id = p_booking_id
  limit 1;
$$;

revoke all on function public.get_profesor_booking_detail_context(uuid, bigint) from public;
revoke all on function public.get_profesor_booking_detail_context(uuid, bigint) from anon;
grant execute on function public.get_profesor_booking_detail_context(uuid, bigint) to authenticated;

create or replace function public.get_profesor_alumno_next_bookings(
  p_profesor_id uuid,
  p_alumno_id uuid,
  p_limit int default 5,
  p_exclude_booking_id bigint default null
)
returns table (
  id bigint,
  date date,
  start_time time,
  end_time time,
  type text,
  status text
)
language sql
security definer
set search_path = public
as $$
  with now_ar as (
    select (now() at time zone 'America/Argentina/Buenos_Aires') as current_ar
  )
  select
    b.id,
    b.date,
    b.start_time,
    b.end_time,
    b.type,
    b.status
  from public.bookings b
  cross join now_ar n
  where b.profesor_id = p_profesor_id
    and b.alumno_id = p_alumno_id
    and b.status in ('pendiente', 'confirmado')
    and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
    and (b.date::timestamp + b.start_time) >= n.current_ar
  order by b.date asc, b.start_time asc
  limit greatest(1, least(coalesce(p_limit, 5), 10));
$$;

revoke all on function public.get_profesor_alumno_next_bookings(uuid, uuid, int, bigint) from public;
revoke all on function public.get_profesor_alumno_next_bookings(uuid, uuid, int, bigint) from anon;
grant execute on function public.get_profesor_alumno_next_bookings(uuid, uuid, int, bigint) to authenticated;
