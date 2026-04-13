-- Crea una transacción de pago en estado pending con validaciones e idempotencia básica.
create or replace function public.create_payment_transaction(
  p_gateway text,
  p_amount numeric,
  p_currency text default 'ARS',
  p_student_package_id bigint default null,
  p_reserva_cancha_id bigint default null,
  p_profesor_id uuid default null,
  p_club_id bigint default null,
  p_payer_email text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_existing_id bigint;
begin
  -- Valida que se especifique exactamente uno de student_package_id o reserva_cancha_id.
  if (p_student_package_id is null) = (p_reserva_cancha_id is null) then
    raise exception 'Debe especificarse exactamente uno de student_package_id o reserva_cancha_id';
  end if;

  -- Valida que el gateway esté soportado por la plataforma.
  if p_gateway not in ('mercadopago', 'stripe') then
    raise exception 'Gateway no soportado: %', p_gateway;
  end if;

  -- Aplica idempotencia: si ya hay una pending equivalente del mismo usuario, reutiliza el id.
  select id into v_existing_id
  from payment_transactions
  where gateway_status = 'pending'
    and payer_user_id = auth.uid()
    and (
      (p_student_package_id is not null and student_package_id = p_student_package_id)
      or
      (p_reserva_cancha_id is not null and reserva_cancha_id = p_reserva_cancha_id)
    )
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  -- Inserta una nueva transacción pending con el usuario autenticado como pagador.
  insert into payment_transactions (
    gateway, amount, currency,
    student_package_id, reserva_cancha_id,
    profesor_id, club_id,
    payer_user_id, payer_email
  ) values (
    p_gateway, p_amount, p_currency,
    p_student_package_id, p_reserva_cancha_id,
    p_profesor_id, p_club_id,
    auth.uid(), p_payer_email
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_payment_transaction(text, numeric, text, bigint, bigint, uuid, bigint, text) to authenticated;
