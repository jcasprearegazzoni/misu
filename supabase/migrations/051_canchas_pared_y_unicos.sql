-- Agrega pared para canchas de pádel y evita duplicados por club + deporte + nombre.

alter table public.canchas
  add column if not exists pared text;

alter table public.canchas
  drop constraint if exists canchas_pared_check;
alter table public.canchas
  add constraint canchas_pared_check
  check (pared is null or pared in ('blindex', 'muro', 'mixto'));

create unique index if not exists canchas_unique_nombre_deporte
  on public.canchas (club_id, deporte, nombre);
