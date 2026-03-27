create table if not exists public.payments (
  id bigint generated always as identity primary key,
  profesor_id uuid not null references auth.users(id) on delete cascade,
  alumno_id uuid not null references auth.users(id) on delete restrict,
  booking_id bigint null references public.bookings(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('efectivo', 'transferencia_directa')),
  type text not null check (
    type in ('clase', 'paquete', 'seña', 'diferencia_cobro', 'reembolso')
  ),
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists payments_profesor_created_idx
  on public.payments (profesor_id, created_at desc);

create index if not exists payments_profesor_alumno_idx
  on public.payments (profesor_id, alumno_id, created_at desc);

create index if not exists payments_booking_idx
  on public.payments (booking_id);

alter table public.payments enable row level security;

revoke all on table public.payments from public;
revoke all on table public.payments from anon;
revoke all on table public.payments from authenticated;

grant select, insert on table public.payments to authenticated;

drop policy if exists "payments_select_profesor_own" on public.payments;
create policy "payments_select_profesor_own"
  on public.payments
  for select
  to authenticated
  using (profesor_id = auth.uid());

drop policy if exists "payments_select_alumno_own" on public.payments;
create policy "payments_select_alumno_own"
  on public.payments
  for select
  to authenticated
  using (alumno_id = auth.uid());

drop policy if exists "payments_insert_profesor_own" on public.payments;
create policy "payments_insert_profesor_own"
  on public.payments
  for insert
  to authenticated
  with check (profesor_id = auth.uid());

