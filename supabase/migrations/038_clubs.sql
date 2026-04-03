-- Tabla de clubes donde los profesores dan clases.
-- Un profesor puede tener múltiples clubes con distintas condiciones de cancha.
-- profesor_id referencia auth.users(id) para coincidir con el patrón del resto de tablas.

create table public.clubs (
  id serial primary key,
  profesor_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  direccion text,
  deporte text not null default 'ambos' check (deporte in ('tenis', 'padel', 'ambos')),
  court_cost_mode text not null check (court_cost_mode in ('fixed_per_hour', 'per_student_percentage')),
  court_cost_per_hour numeric(10,2),
  court_percentage_per_student numeric(5,2),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

create policy "profesores_ven_sus_clubes"
  on public.clubs for select
  to authenticated
  using (auth.uid() = profesor_id);

create policy "profesores_insertan_sus_clubes"
  on public.clubs for insert
  to authenticated
  with check (auth.uid() = profesor_id);

create policy "profesores_actualizan_sus_clubes"
  on public.clubs for update
  to authenticated
  using (auth.uid() = profesor_id)
  with check (auth.uid() = profesor_id);

create policy "profesores_eliminan_sus_clubes"
  on public.clubs for delete
  to authenticated
  using (auth.uid() = profesor_id);
