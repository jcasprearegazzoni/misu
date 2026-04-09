-- Fallback de sport: si el booking no tiene deporte asignado, se intenta inferirlo
-- del perfil del profesor. Esto cubre bookings legacy, clases manuales del profesor
-- y cualquier flujo donde sport no fue seteado al crear el booking.
-- Si el profesor enseña 'ambos', no se puede inferir el deporte → error explicito.

create or replace function public.confirm_booking_with_court(
  p_booking_id bigint,
  p_profesor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking    record;
  v_sport      text;
  v_cancha_id  integer;
  v_lock_key   bigint;
begin
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para confirmar esta clase.';
  end if;

  select
    b.id,
    b.profesor_id,
    b.club_id,
    b.date,
    b.start_time,
    b.end_time,
    b.status,
    b.cancha_id,
    b.sport
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
    and b.profesor_id = p_profesor_id
  for update;

  if not found then
    raise exception 'Booking no encontrado.';
  end if;

  if v_booking.status = 'cancelado' then
    raise exception 'No se puede confirmar una clase cancelada.';
  end if;

  if v_booking.status = 'confirmado' then
    if v_booking.club_id is null then
      return true;
    end if;

    if v_booking.cancha_id is null then
      raise exception 'La clase ya esta confirmada, pero no tiene cancha asignada.';
    end if;

    perform public.sync_booking_class_reservation(v_booking.id);
    return true;
  end if;

  -- Clase particular: confirmar sin asignar cancha.
  if v_booking.club_id is null then
    update public.bookings
    set
      status = 'confirmado',
      cancha_id = null
    where id = v_booking.id;
    return true;
  end if;

  -- Clase en club: necesitamos el deporte para buscar la cancha correcta.
  v_sport := v_booking.sport;

  -- Si el booking no tiene deporte, intentar inferirlo del perfil del profesor.
  if v_sport is null then
    select p.sport::text into v_sport
    from public.profiles p
    where p.user_id = v_booking.profesor_id;

    -- Si el profesor enseña ambos deportes no podemos elegir por él.
    if v_sport is null or v_sport = 'ambos' then
      raise exception 'La clase no tiene deporte asignado. El alumno debe especificar si la clase es de tenis o padel.';
    end if;

    -- Actualizar el booking para que quede consistente.
    update public.bookings
    set sport = v_sport
    where id = v_booking.id;
  end if;

  v_lock_key := hashtextextended(
    v_booking.club_id::text || '|' || v_booking.date::text || '|' || v_booking.start_time::text || '|' || v_booking.end_time::text,
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  select c.id
  into v_cancha_id
  from public.canchas c
  where c.club_id = v_booking.club_id
    and c.activa = true
    and c.deporte = v_sport
    and not exists (
      select 1
      from public.reservas_cancha r
      where r.club_id = v_booking.club_id
        and r.cancha_id = c.id
        and r.estado in ('pendiente', 'confirmada')
        and r.fecha = v_booking.date
        and r.hora_inicio < v_booking.end_time
        and r.hora_fin > v_booking.start_time
    )
    and not exists (
      select 1
      from public.bookings b
      where b.club_id = v_booking.club_id
        and b.status = 'confirmado'
        and b.id <> v_booking.id
        and b.cancha_id = c.id
        and b.date = v_booking.date
        and b.start_time < v_booking.end_time
        and b.end_time > v_booking.start_time
    )
  order by c.id desc
  limit 1;

  if v_cancha_id is null then
    raise exception 'No hay canchas de % disponibles en este horario para confirmar la clase.', v_sport;
  end if;

  update public.bookings
  set
    status = 'confirmado',
    cancha_id = v_cancha_id
  where id = v_booking.id;

  return true;
end;
$$;

revoke all on function public.confirm_booking_with_court(bigint, uuid) from public;
revoke all on function public.confirm_booking_with_court(bigint, uuid) from anon;
grant execute on function public.confirm_booking_with_court(bigint, uuid) to authenticated;
