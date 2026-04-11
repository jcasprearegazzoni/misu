create or replace function public.get_profesor_week_booking_contexts(
  p_profesor_id uuid,
  p_booking_ids bigint[]
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
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo el profesor autenticado puede consultar su propio contexto semanal.
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para consultar contexto de reservas de este profesor.';
  end if;

  return query
  select
    b.id as booking_id,
    b.alumno_id,
    coalesce(nullif(trim(p.name), ''), 'Alumno') as alumno_name,
    -- category fue renombrado a category_padel en migración 042; se combina con category_tenis.
    nullif(trim(
      coalesce(p.category_padel, '')
      || case when p.category_tenis is not null then ' · ' || p.category_tenis else '' end
    ), '') as alumno_category,
    p.branch as alumno_branch,
    p.zone as alumno_zone,
    -- has_equipment fue deprecado en migración 043; se reemplaza por has_paleta / has_raqueta.
    (coalesce(p.has_paleta, false) or coalesce(p.has_raqueta, false)) as alumno_has_equipment,
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
    and b.id = any(coalesce(p_booking_ids, '{}'::bigint[]));
end;
$$;

revoke all on function public.get_profesor_week_booking_contexts(uuid, bigint[]) from public;
revoke all on function public.get_profesor_week_booking_contexts(uuid, bigint[]) from anon;
grant execute on function public.get_profesor_week_booking_contexts(uuid, bigint[]) to authenticated;

create or replace function public.get_profesor_week_next_bookings(
  p_profesor_id uuid,
  p_alumno_ids uuid[],
  p_limit int default 5
)
returns table (
  alumno_id uuid,
  id bigint,
  date date,
  start_time time,
  end_time time,
  type text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo el profesor autenticado puede consultar próximas clases de sus alumnos.
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para consultar próximas clases de este profesor.';
  end if;

  return query
  with now_ar as (
    select (now() at time zone 'America/Argentina/Buenos_Aires') as current_ar
  ),
  ranked as (
    select
      b.alumno_id,
      b.id,
      b.date,
      b.start_time,
      b.end_time,
      b.type,
      b.status,
      row_number() over (
        partition by b.alumno_id
        order by b.date asc, b.start_time asc
      ) as rn
    from public.bookings b
    cross join now_ar n
    where b.profesor_id = p_profesor_id
      and b.alumno_id = any(coalesce(p_alumno_ids, '{}'::uuid[]))
      and b.status in ('pendiente', 'confirmado')
      and (b.date::timestamp + b.start_time) >= n.current_ar
  )
  select
    r.alumno_id,
    r.id,
    r.date,
    r.start_time,
    r.end_time,
    r.type,
    r.status
  from ranked r
  where r.rn <= greatest(1, least(coalesce(p_limit, 5), 10))
  order by r.alumno_id asc, r.date asc, r.start_time asc;
end;
$$;

revoke all on function public.get_profesor_week_next_bookings(uuid, uuid[], int) from public;
revoke all on function public.get_profesor_week_next_bookings(uuid, uuid[], int) from anon;
grant execute on function public.get_profesor_week_next_bookings(uuid, uuid[], int) to authenticated;

