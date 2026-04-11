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
    -- Mostrar categoria segun el deporte de la clase (sin mezclar tenis y padel).
    case
      when b.sport = 'padel' then nullif(trim(p.category_padel), '')
      when b.sport = 'tenis' then nullif(trim(p.category_tenis), '')
      -- Fallback para clases legacy sin deporte definido.
      when p.sport = 'padel' then nullif(trim(p.category_padel), '')
      when p.sport = 'tenis' then nullif(trim(p.category_tenis), '')
      else null
    end as alumno_category,
    p.branch as alumno_branch,
    p.zone as alumno_zone,
    -- Mostrar equipamiento segun el deporte de la clase.
    case
      when b.sport = 'padel' then coalesce(p.has_paleta, false)
      when b.sport = 'tenis' then coalesce(p.has_raqueta, false)
      -- Fallback para clases legacy sin deporte definido.
      when p.sport = 'padel' then coalesce(p.has_paleta, false)
      when p.sport = 'tenis' then coalesce(p.has_raqueta, false)
      else false
    end as alumno_has_equipment,
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
