-- Canchas de cada club con sus características físicas.

create table public.canchas (
  id serial primary key,
  club_id integer not null references public.clubs(id) on delete cascade,
  nombre text not null,
  deporte text not null check (deporte in ('tenis', 'padel', 'futbol', 'otro')),
  superficie text not null check (superficie in ('sintetico', 'polvo_ladrillo', 'cemento', 'blindex', 'otro')),
  techada boolean not null default false,
  iluminacion boolean not null default false,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.canchas enable row level security;

-- Lectura pública para alumnos y profesores.
create policy "canchas_lectura_autenticados"
  on public.canchas for select
  to authenticated
  using (true);

-- Solo el club dueño puede gestionar sus canchas.
create policy "canchas_gestion_club"
  on public.canchas for insert
  to authenticated
  with check (
    exists (
      select 1 from public.clubs
      where clubs.id = canchas.club_id
        and clubs.user_id = auth.uid()
    )
  );

create policy "canchas_update_club"
  on public.canchas for update
  to authenticated
  using (
    exists (
      select 1 from public.clubs
      where clubs.id = canchas.club_id
        and clubs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clubs
      where clubs.id = canchas.club_id
        and clubs.user_id = auth.uid()
    )
  );

create policy "canchas_delete_club"
  on public.canchas for delete
  to authenticated
  using (
    exists (
      select 1 from public.clubs
      where clubs.id = canchas.club_id
        and clubs.user_id = auth.uid()
    )
  );
