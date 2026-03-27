alter table public.profiles
  add column if not exists category text,
  add column if not exists branch text,
  add column if not exists zone text,
  add column if not exists has_equipment boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_category_not_blank_check;

alter table public.profiles
  add constraint profiles_category_not_blank_check
  check (category is null or length(trim(category)) > 0);

alter table public.profiles
  drop constraint if exists profiles_branch_not_blank_check;

alter table public.profiles
  add constraint profiles_branch_not_blank_check
  check (branch is null or length(trim(branch)) > 0);

alter table public.profiles
  drop constraint if exists profiles_zone_not_blank_check;

alter table public.profiles
  add constraint profiles_zone_not_blank_check
  check (zone is null or length(trim(zone)) > 0);
