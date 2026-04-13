-- Agrega token de acceso de pasarela a nivel perfil (profesor).
alter table public.profiles
  add column if not exists payment_gateway_access_token text;

-- Agrega token de acceso de pasarela a nivel configuracion de club.
alter table public.club_configuracion
  add column if not exists payment_gateway_access_token text;
