-- Permite pagos sin profesor cuando el cobro corresponde al flujo de club.
alter table public.payments
  alter column profesor_id drop not null;

-- Permite pagos sin alumno para casos de reserva de cancha con pagador anonimo.
alter table public.payments
  alter column alumno_id drop not null;

-- Agrega referencias para trazabilidad de pagos online y reservas/paquetes.
alter table public.payments
  add column if not exists club_id bigint references public.clubs(id) on delete set null,
  add column if not exists student_package_id bigint references public.student_packages(id) on delete set null,
  add column if not exists reserva_cancha_id bigint references public.reservas_cancha(id) on delete set null,
  add column if not exists payment_transaction_id bigint references public.payment_transactions(id) on delete set null;

-- Garantiza que cada pago tenga al menos un contexto de cobro (profesor o club).
alter table public.payments
  drop constraint if exists payments_require_profesor_or_club;

alter table public.payments
  add constraint payments_require_profesor_or_club
  check (profesor_id is not null or club_id is not null);

-- Agrega indices para filtros frecuentes por nuevas relaciones.
create index if not exists idx_payments_club_id
  on public.payments(club_id);

create index if not exists idx_payments_student_package_id
  on public.payments(student_package_id);

create index if not exists idx_payments_reserva_cancha_id
  on public.payments(reserva_cancha_id);

create index if not exists idx_payments_payment_transaction_id
  on public.payments(payment_transaction_id);

-- Habilita lectura de pagos para el club dueno de la operacion.
drop policy if exists payments_select_club_own on public.payments;

create policy payments_select_club_own
  on public.payments
  for select
  to authenticated
  using (club_id in (select id from public.clubs where user_id = auth.uid()));
