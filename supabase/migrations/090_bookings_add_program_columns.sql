-- Extiende bookings para soportar programas.
-- Se agrega solo student_program_id — no se usan program_consumed ni consumed_student_program_id
-- porque los programas son siempre estructurados (no hay consumo de créditos al confirmar).
-- Las columnas antiguas de paquetes (package_consumed, consumed_student_package_id) se mantienen.

alter table public.bookings
  add column if not exists student_program_id bigint
    references public.student_programs(id) on delete set null;

create index if not exists bookings_student_program_id_idx
  on public.bookings (student_program_id);

-- Extiende payment_transactions para referenciar student_programs.
alter table public.payment_transactions
  add column if not exists student_program_id bigint
    references public.student_programs(id) on delete set null;

create index if not exists idx_payment_transactions_student_program_id
  on public.payment_transactions (student_program_id);

-- Extiende payments: agrega tipos 'programa' y 'membresia', y FK a student_programs.
alter table public.payments
  drop constraint if exists payments_type_check;
alter table public.payments
  add constraint payments_type_check check (
    type in ('clase', 'paquete', 'seña', 'diferencia_cobro', 'reembolso', 'programa', 'membresia')
  );

alter table public.payments
  add column if not exists student_program_id bigint
    references public.student_programs(id) on delete set null;

create index if not exists idx_payments_student_program_id
  on public.payments (student_program_id);
