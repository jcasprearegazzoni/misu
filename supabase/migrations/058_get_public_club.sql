create or replace function public.get_public_club_by_username(p_username text)
returns table (
  id integer,
  nombre text,
  username text,
  direccion text,
  telefono text,
  email_contacto text,
  website text,
  tiene_bar boolean,
  tiene_estacionamiento boolean,
  alquila_paletas boolean,
  alquila_raquetas boolean,
  tiene_vestuario boolean,
  tiene_parrilla boolean
)
language sql
security definer
set search_path = public
as $$
  select
    clubs.id,
    clubs.nombre,
    clubs.username,
    clubs.direccion,
    clubs.telefono,
    clubs.email_contacto,
    clubs.website,
    clubs.tiene_bar,
    clubs.tiene_estacionamiento,
    clubs.alquila_paletas,
    clubs.alquila_raquetas,
    clubs.tiene_vestuario,
    clubs.tiene_parrilla
  from public.clubs
  where clubs.username = p_username
    and clubs.is_placeholder = false
  limit 1;
$$;

revoke all on function public.get_public_club_by_username(text) from public;
grant execute on function public.get_public_club_by_username(text) to anon, authenticated;
