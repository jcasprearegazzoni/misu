create unique index if not exists payments_unique_booking_coverage_idx
  on public.payments (booking_id)
  where booking_id is not null
    and type in ('clase', 'seña', 'diferencia_cobro');

