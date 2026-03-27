alter table public.bookings
  add column if not exists type text;

update public.bookings
set type = 'individual'
where type is null;

alter table public.bookings
  alter column type set not null;

alter table public.bookings
  drop constraint if exists bookings_type_check;

alter table public.bookings
  add constraint bookings_type_check
  check (type in ('individual', 'dobles', 'grupal'));
