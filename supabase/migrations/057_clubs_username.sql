alter table public.clubs
  add column if not exists username text unique;

-- Indice para busqueda rapida por username
create unique index if not exists clubs_username_idx on public.clubs (username);
