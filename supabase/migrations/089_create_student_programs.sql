-- Tabla student_programs (reemplaza student_packages).
-- Registra la inscripción de un alumno a un programa.
-- classes_remaining se inicializa al número de bookings generados y se decrementa
-- cuando se cancela un booking del programa.

create table if not exists public.student_programs (
  id bigint generated always as identity primary key,
  alumno_id uuid not null references auth.users(id) on delete restrict,
  program_id bigint not null references public.programs(id) on delete restrict,
  profesor_id uuid references auth.users(id) on delete cascade,
  club_id bigint references public.clubs(id) on delete cascade,
  classes_remaining int not null default 0 check (classes_remaining >= 0),
  paid boolean not null default false,
  origen text not null default 'manual'
    check (origen in ('manual', 'online', 'programa')),
  fecha_inscripcion timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists student_programs_alumno_id_idx
  on public.student_programs (alumno_id);
create index if not exists student_programs_program_id_idx
  on public.student_programs (program_id);
create index if not exists student_programs_profesor_id_idx
  on public.student_programs (profesor_id, alumno_id, created_at desc);
create index if not exists student_programs_club_id_idx
  on public.student_programs (club_id);
create index if not exists student_programs_paid_remaining_idx
  on public.student_programs (profesor_id, alumno_id, paid, classes_remaining);

alter table public.student_programs enable row level security;

revoke all on table public.student_programs from public;
revoke all on table public.student_programs from anon;
revoke all on table public.student_programs from authenticated;
grant select, insert on table public.student_programs to authenticated;
grant update (paid, classes_remaining) on table public.student_programs to authenticated;

-- Profesor ve y gestiona las inscripciones de sus propios programas.
drop policy if exists student_programs_select_profesor_own on public.student_programs;
create policy student_programs_select_profesor_own on public.student_programs
  for select to authenticated using (profesor_id = auth.uid());

drop policy if exists student_programs_insert_profesor_own on public.student_programs;
create policy student_programs_insert_profesor_own on public.student_programs
  for insert to authenticated with check (profesor_id = auth.uid());

drop policy if exists student_programs_update_paid_profesor_own on public.student_programs;
create policy student_programs_update_paid_profesor_own on public.student_programs
  for update to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

-- Club ve las inscripciones de sus programas.
drop policy if exists student_programs_select_club_own on public.student_programs;
create policy student_programs_select_club_own on public.student_programs
  for select to authenticated
  using (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

-- Alumno ve sus propias inscripciones.
drop policy if exists student_programs_select_alumno_own on public.student_programs;
create policy student_programs_select_alumno_own on public.student_programs
  for select to authenticated using (alumno_id = auth.uid());

-- Alumno puede inscribirse (insert propio) — para compra online desde perfil público.
drop policy if exists student_programs_insert_alumno_own on public.student_programs;
create policy student_programs_insert_alumno_own on public.student_programs
  for insert to authenticated with check (alumno_id = auth.uid());
