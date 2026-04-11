create or replace function public.resolve_expired_solo_decisions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int := 0;
begin
  with expired as (
    select d.id, d.booking_id, d.alumno_id, b.date as booking_date
    from public.booking_solo_decisions d
    join public.bookings b on b.id = d.booking_id
    where d.status = 'pendiente'
      and d.decision_deadline_at is not null
      and d.decision_deadline_at <= now()
    for update of d skip locked
  ),
  updated_bookings as (
    update public.bookings b
    set status = 'cancelado'
    from expired e
    where b.id = e.booking_id
      and b.status in ('pendiente', 'confirmado')
    returning b.id
  ),
  updated_decisions as (
    update public.booking_solo_decisions d
    set status = 'cancelada_timeout',
        responded_at = now()
    from expired e
    where d.id = e.id
      and d.status = 'pendiente'
    returning d.id, d.alumno_id, e.booking_date
  ),
  inserted_notifications as (
    -- Notifica al alumno cada decision vencida con la fecha de la clase cancelada.
    insert into public.notifications (user_id, type, title, message)
    select
      u.alumno_id,
      'solo_decision_timeout',
      U&'Tu decisi\00F3n venci\00F3',
      format(U&'La clase del %s fue cancelada porque tu decisi\00F3n venci\00F3.', u.booking_date::text)
    from updated_decisions u
    returning id
  )
  select count(*) into v_updated from updated_decisions;

  return v_updated;
end;
$$;

revoke all on function public.resolve_expired_solo_decisions() from public;
revoke all on function public.resolve_expired_solo_decisions() from anon;
revoke all on function public.resolve_expired_solo_decisions() from authenticated;
grant execute on function public.resolve_expired_solo_decisions() to service_role;

