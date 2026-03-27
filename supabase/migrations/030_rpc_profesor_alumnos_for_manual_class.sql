create or replace function public.get_profesor_alumnos_for_manual_class(
  p_profesor_id uuid
)
returns table (
  alumno_id uuid,
  alumno_name text
)
language sql
security definer
set search_path = public
as $$
  with related_alumnos as (
    select b.alumno_id
    from public.bookings b
    where b.profesor_id = p_profesor_id

    union

    select sp.alumno_id
    from public.student_packages sp
    where sp.profesor_id = p_profesor_id
  )
  select
    ra.alumno_id,
    coalesce(nullif(trim(p.name), ''), 'Alumno') as alumno_name
  from related_alumnos ra
  left join public.profiles p on p.user_id = ra.alumno_id
  order by alumno_name asc;
$$;

revoke all on function public.get_profesor_alumnos_for_manual_class(uuid) from public;
revoke all on function public.get_profesor_alumnos_for_manual_class(uuid) from anon;
grant execute on function public.get_profesor_alumnos_for_manual_class(uuid) to authenticated;
