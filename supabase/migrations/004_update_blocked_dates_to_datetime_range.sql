alter table public.blocked_dates
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz;

-- Migra datos existentes (blocked_date) a rango completo del dia:
-- start_at = 00:00:00 y end_at = 23:59:59 del mismo dia.
update public.blocked_dates
set
  start_at = coalesce(
    start_at,
    blocked_date::timestamp
  ),
  end_at = coalesce(
    end_at,
    (blocked_date::timestamp + interval '1 day' - interval '1 second')
  )
where blocked_date is not null;

alter table public.blocked_dates
  alter column start_at set not null,
  alter column end_at set not null;

alter table public.blocked_dates
  drop constraint if exists blocked_dates_start_before_end_check;

alter table public.blocked_dates
  add constraint blocked_dates_start_before_end_check
  check (start_at < end_at);

drop index if exists blocked_dates_unique_idx;

create unique index if not exists blocked_dates_unique_range_idx
  on public.blocked_dates (profesor_id, start_at, end_at);

alter table public.blocked_dates
  drop column if exists blocked_date;
