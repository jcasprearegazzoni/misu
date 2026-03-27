alter table public.profiles
  add column if not exists court_cost_mode text not null default 'fixed_per_hour',
  add column if not exists court_percentage_per_student numeric(5,2);

alter table public.profiles
  drop constraint if exists profiles_court_cost_mode_check;

alter table public.profiles
  add constraint profiles_court_cost_mode_check
  check (court_cost_mode in ('fixed_per_hour', 'per_student_percentage'));

alter table public.profiles
  drop constraint if exists profiles_court_percentage_per_student_non_negative;

alter table public.profiles
  add constraint profiles_court_percentage_per_student_non_negative
  check (
    court_percentage_per_student is null
    or (court_percentage_per_student >= 0 and court_percentage_per_student <= 100)
  );
