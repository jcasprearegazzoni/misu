-- Tabla programs (reemplaza packages).
-- Todos los programas son estructurados: siempre tienen horario fijo.
-- Al inscribir un alumno se auto-generan todos los bookings del período.

create table if not exists public.programs (
  id bigint generated always as identity primary key,
  profesor_id uuid references auth.users(id) on delete cascade,
  club_id bigint references public.clubs(id) on delete cascade,
  nombre text not null,
  descripcion text,
  categoria text,
  nivel text not null default 'libre'
    check (nivel in ('libre', 'principiante', 'intermedio', 'avanzado')),
  deporte text not null default 'tenis'
    check (deporte in ('tenis', 'padel', 'ambos')),
  tipo_clase text not null default 'individual'
    check (tipo_clase in ('individual', 'dobles', 'trio', 'grupal')),
  total_clases int not null check (total_clases > 0),
  precio numeric(12, 2) not null check (precio >= 0),
  cupo_max int null check (cupo_max is null or cupo_max > 0),
  fecha_inicio date not null,
  fecha_fin date not null,
  dias_semana int[] not null,  -- 0=Dom..6=Sab (PostgreSQL EXTRACT(DOW) convention)
  hora_inicio time not null,
  hora_fin time not null,
  estado text not null default 'activo'
    check (estado in ('borrador', 'activo', 'cerrado', 'finalizado')),
  visibilidad text not null default 'privado'
    check (visibilidad in ('privado', 'publico')),
  active boolean not null default true,
  created_at timestamptz not null default now(),

  -- Al menos uno de profesor_id o club_id debe estar definido.
  constraint programs_require_owner check (
    profesor_id is not null or club_id is not null
  ),
  -- Las fechas deben estar en orden.
  constraint programs_dates_order check (fecha_fin >= fecha_inicio),
  -- Debe haber al menos un día seleccionado.
  constraint programs_days_nonempty check (array_length(dias_semana, 1) > 0)
);

create index if not exists programs_profesor_id_idx
  on public.programs (profesor_id, created_at desc);
create index if not exists programs_club_id_idx
  on public.programs (club_id, created_at desc);
create index if not exists programs_visibilidad_estado_idx
  on public.programs (visibilidad, estado, active);

alter table public.programs enable row level security;

revoke all on table public.programs from public;
revoke all on table public.programs from anon;
revoke all on table public.programs from authenticated;
grant select, insert, update on table public.programs to authenticated;

-- Profesor puede ver y gestionar sus propios programas.
drop policy if exists programs_select_profesor_own on public.programs;
create policy programs_select_profesor_own on public.programs
  for select to authenticated
  using (profesor_id = auth.uid());

drop policy if exists programs_insert_profesor_own on public.programs;
create policy programs_insert_profesor_own on public.programs
  for insert to authenticated
  with check (profesor_id = auth.uid());

drop policy if exists programs_update_profesor_own on public.programs;
create policy programs_update_profesor_own on public.programs
  for update to authenticated
  using (profesor_id = auth.uid())
  with check (profesor_id = auth.uid());

-- Club puede ver y gestionar programas de clubes que administra.
drop policy if exists programs_select_club_own on public.programs;
create policy programs_select_club_own on public.programs
  for select to authenticated
  using (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

drop policy if exists programs_insert_club_own on public.programs;
create policy programs_insert_club_own on public.programs
  for insert to authenticated
  with check (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

drop policy if exists programs_update_club_own on public.programs;
create policy programs_update_club_own on public.programs
  for update to authenticated
  using (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  )
  with check (
    club_id in (
      select id from public.clubs where user_id = auth.uid()
    )
  );

-- Programas públicos visibles para todos los autenticados.
drop policy if exists programs_select_public on public.programs;
create policy programs_select_public on public.programs
  for select to authenticated
  using (visibilidad = 'publico' and estado = 'activo' and active = true);
