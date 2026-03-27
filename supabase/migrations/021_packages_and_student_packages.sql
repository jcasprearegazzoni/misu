create table if not exists public.packages (
  id bigint generated always as identity primary key,
  profesor_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  total_classes int not null check (total_classes > 0),
  price numeric(12,2) not null check (price > 0),
  description text null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists packages_profesor_created_idx
  on public.packages (profesor_id, created_at desc);

create table if not exists public.student_packages (
  id bigint generated always as identity primary key,
  alumno_id uuid not null references auth.users(id) on delete restrict,
  package_id bigint not null references public.packages(id) on delete restrict,
  profesor_id uuid not null references auth.users(id) on delete cascade,
  classes_remaining int not null check (classes_remaining >= 0),
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists student_packages_profesor_alumno_idx
  on public.student_packages (profesor_id, alumno_id, created_at asc);

create index if not exists student_packages_package_idx
  on public.student_packages (package_id);

alter table public.bookings
  add column if not exists package_consumed boolean not null default false;

alter table public.bookings
  add column if not exists consumed_student_package_id bigint null references public.student_packages(id) on delete set null;

create index if not exists bookings_consumed_student_package_idx
  on public.bookings (consumed_student_package_id);

alter table public.packages enable row level security;
alter table public.student_packages enable row level security;

revoke all on table public.packages from public;
revoke all on table public.packages from anon;
revoke all on table public.packages from authenticated;

revoke all on table public.student_packages from public;
revoke all on table public.student_packages from anon;
revoke all on table public.student_packages from authenticated;

grant select, insert on table public.packages to authenticated;
grant select, insert on table public.student_packages to authenticated;
grant update (paid) on table public.student_packages to authenticated;

drop policy if exists "packages_select_profesor_own" on public.packages;
create policy "packages_select_profesor_own"
  on public.packages
  for select
  to authenticated
  using (profesor_id = auth.uid());

drop policy if exists "packages_insert_profesor_own" on public.packages;
create policy "packages_insert_profesor_own"
  on public.packages
  for insert
  to authenticated
  with check (profesor_id = auth.uid());

drop policy if exists "student_packages_select_profesor_own" on public.student_packages;
create policy "student_packages_select_profesor_own"
  on public.student_packages
  for select
  to authenticated
  using (profesor_id = auth.uid());

drop policy if exists "student_packages_insert_profesor_own" on public.student_packages;
create policy "student_packages_insert_profesor_own"
  on public.student_packages
  for insert
  to authenticated
  with check (profesor_id = auth.uid());

drop policy if exists "student_packages_update_paid_profesor_own" on public.student_packages;
create policy "student_packages_update_paid_profesor_own"
  on public.student_packages
  for update
  to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

drop policy if exists "student_packages_select_alumno_own" on public.student_packages;
create policy "student_packages_select_alumno_own"
  on public.student_packages
  for select
  to authenticated
  using (alumno_id = auth.uid());

create or replace function public.consume_student_package_credit_on_booking_confirm(
  p_booking_id bigint,
  p_profesor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alumno_id uuid;
  v_student_package_id bigint;
begin
  if auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para consumir creditos de este profesor.';
  end if;

  select b.alumno_id
    into v_alumno_id
  from public.bookings b
  where b.id = p_booking_id
    and b.profesor_id = p_profesor_id
    and b.status = 'confirmado'
    and b.package_consumed = false
  for update;

  if v_alumno_id is null then
    return false;
  end if;

  select sp.id
    into v_student_package_id
  from public.student_packages sp
  join public.packages p on p.id = sp.package_id
  where sp.profesor_id = p_profesor_id
    and sp.alumno_id = v_alumno_id
    and sp.paid = true
    and sp.classes_remaining > 0
    and p.active = true
  order by sp.created_at asc, sp.id asc
  limit 1
  for update skip locked;

  if v_student_package_id is null then
    return false;
  end if;

  update public.student_packages
  set classes_remaining = classes_remaining - 1
  where id = v_student_package_id
    and classes_remaining > 0;

  update public.bookings
  set package_consumed = true,
      consumed_student_package_id = v_student_package_id
  where id = p_booking_id
    and package_consumed = false;

  return true;
end;
$$;

revoke all on function public.consume_student_package_credit_on_booking_confirm(bigint, uuid) from public;
revoke all on function public.consume_student_package_credit_on_booking_confirm(bigint, uuid) from anon;
grant execute on function public.consume_student_package_credit_on_booking_confirm(bigint, uuid) to authenticated;

