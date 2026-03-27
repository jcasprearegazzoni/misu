alter table public.profiles
  add column if not exists court_cost_per_hour numeric(10,2);

alter table public.profiles
  drop constraint if exists profiles_court_cost_per_hour_non_negative;

alter table public.profiles
  add constraint profiles_court_cost_per_hour_non_negative
  check (court_cost_per_hour is null or court_cost_per_hour >= 0);
