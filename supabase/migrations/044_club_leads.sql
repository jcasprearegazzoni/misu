-- Solicitudes de clubes que quieren unirse a misu.
-- No genera cuenta todavía, es un lead para validación manual.

create table public.club_leads (
  id serial primary key,
  nombre text not null,
  direccion text,
  cuit text not null,
  email text not null,
  telefono text not null,
  mensaje text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now()
);

alter table public.club_leads enable row level security;

-- Solo service_role puede leer/modificar leads (operación interna).
-- El insert es público (anon) para que el formulario funcione sin auth.
create policy "leads_insert_publico"
  on public.club_leads for insert
  to anon, authenticated
  with check (true);
