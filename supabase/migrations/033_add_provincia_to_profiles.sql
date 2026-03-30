-- Agrega columna provincia a perfiles para búsqueda geográfica futura.
alter table public.profiles
  add column if not exists provincia text;

alter table public.profiles
  add constraint profiles_provincia_not_blank_check
  check (provincia is null or trim(provincia) <> '');
