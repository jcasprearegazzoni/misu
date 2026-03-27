alter table public.profiles
  add column if not exists cancel_without_charge_hours integer,
  add column if not exists solo_warning_hours integer,
  add column if not exists solo_decision_deadline_minutes integer;

alter table public.profiles
  drop constraint if exists profiles_cancel_without_charge_hours_check;

alter table public.profiles
  add constraint profiles_cancel_without_charge_hours_check
  check (
    cancel_without_charge_hours is null
    or cancel_without_charge_hours >= 0
    and cancel_without_charge_hours <= 168
  );

alter table public.profiles
  drop constraint if exists profiles_solo_warning_hours_check;

alter table public.profiles
  add constraint profiles_solo_warning_hours_check
  check (
    solo_warning_hours is null
    or solo_warning_hours >= 0
    and solo_warning_hours <= 168
  );

alter table public.profiles
  drop constraint if exists profiles_solo_decision_deadline_minutes_check;

alter table public.profiles
  add constraint profiles_solo_decision_deadline_minutes_check
  check (
    solo_decision_deadline_minutes is null
    or solo_decision_deadline_minutes >= 1
    and solo_decision_deadline_minutes <= 10080
  );

