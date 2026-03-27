alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists sport text,
  add column if not exists price_individual numeric(10,2),
  add column if not exists price_grupal numeric(10,2);

alter table public.profiles
  drop constraint if exists profiles_sport_check;

alter table public.profiles
  add constraint profiles_sport_check
  check (sport is null or sport in ('tenis', 'padel', 'ambos'));

alter table public.profiles
  drop constraint if exists profiles_username_not_blank_check;

alter table public.profiles
  add constraint profiles_username_not_blank_check
  check (username is null or btrim(username) <> '');

alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[A-Za-z0-9_]+$');

alter table public.profiles
  drop constraint if exists profiles_price_individual_check;

alter table public.profiles
  add constraint profiles_price_individual_check
  check (price_individual is null or price_individual >= 0);

alter table public.profiles
  drop constraint if exists profiles_price_grupal_check;

alter table public.profiles
  add constraint profiles_price_grupal_check
  check (price_grupal is null or price_grupal >= 0);

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;
