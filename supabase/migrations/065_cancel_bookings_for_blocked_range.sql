-- RPC transaccional: cancela bookings activos que solapan con un rango bloqueado.
-- Restaura créditos de paquetes de forma atómica y notifica a los alumnos.
-- Parámetros:
--   p_profesor_id: UUID del profesor
--   p_start_at:    inicio del rango bloqueado (TIMESTAMPTZ)
--   p_end_at:      fin del rango bloqueado (TIMESTAMPTZ)
-- Retorna: cantidad de bookings cancelados.

create or replace function public.cancel_bookings_for_blocked_range(
  p_profesor_id uuid,
  p_start_at    timestamptz,
  p_end_at      timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking        record;
  v_cancelled_count integer := 0;
  v_booking_start  timestamptz;
  v_booking_end    timestamptz;
begin
  -- Iterar sobre los bookings activos del profesor en el rango de fechas.
  for v_booking in
    select
      b.id,
      b.alumno_id,
      b.date,
      b.start_time,
      b.end_time,
      b.package_consumed,
      b.consumed_student_package_id
    from bookings b
    where b.profesor_id = p_profesor_id
      and b.status in ('pendiente', 'confirmado')
      -- Rango de fechas: el bloqueo abarca desde la fecha inicial hasta la final.
      and b.date >= (p_start_at at time zone 'America/Argentina/Buenos_Aires')::date
      and b.date <= (p_end_at   at time zone 'America/Argentina/Buenos_Aires')::date
    for update of b skip locked
  loop
    -- Calcular inicio y fin del booking en UTC para comparar con el rango.
    v_booking_start := (v_booking.date::text || 'T' || left(v_booking.start_time::text, 8) || '-03:00')::timestamptz;
    v_booking_end   := (v_booking.date::text || 'T' || left(v_booking.end_time::text,   8) || '-03:00')::timestamptz;

    -- Verificar solape real con el rango bloqueado.
    if v_booking_start >= p_end_at or v_booking_end <= p_start_at then
      continue;
    end if;

    -- Cancelar el booking.
    update bookings
    set status = 'cancelado'
    where id = v_booking.id
      and status in ('pendiente', 'confirmado');

    -- Si no se canceló (otra transacción lo tomó antes), seguir.
    if not found then
      continue;
    end if;

    v_cancelled_count := v_cancelled_count + 1;

    -- Restaurar crédito de paquete de forma atómica si corresponde.
    if v_booking.package_consumed and v_booking.consumed_student_package_id is not null then
      update student_packages
      set classes_remaining = classes_remaining + 1
      where id = v_booking.consumed_student_package_id;

      -- Limpiar el consumo de paquete en el booking.
      update bookings
      set
        package_consumed              = false,
        consumed_student_package_id   = null
      where id = v_booking.id;
    end if;

    -- Notificar al alumno.
    insert into notifications (user_id, type, title, message)
    values (
      v_booking.alumno_id,
      'booking_cancelled',
      'Clase cancelada por ausencia del profesor',
      'Tu clase del ' || v_booking.date::text
        || ' de ' || left(v_booking.start_time::text, 5)
        || ' a '  || left(v_booking.end_time::text, 5)
        || ' fue cancelada porque el profesor registró una ausencia.'
    );
  end loop;

  return v_cancelled_count;
end;
$$;

-- Permitir que usuarios autenticados ejecuten la función.
-- La función es SECURITY DEFINER, por lo que opera con permisos del owner.
revoke all on function public.cancel_bookings_for_blocked_range(uuid, timestamptz, timestamptz) from public;
revoke all on function public.cancel_bookings_for_blocked_range(uuid, timestamptz, timestamptz) from anon;
grant execute on function public.cancel_bookings_for_blocked_range(uuid, timestamptz, timestamptz) to authenticated;
