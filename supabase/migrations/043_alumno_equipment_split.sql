-- Reemplaza has_equipment por has_paleta y has_raqueta.
-- has_equipment se mantiene pero se depreca (queda en null para nuevos registros).

alter table public.profiles
  add column if not exists has_paleta boolean not null default false,
  add column if not exists has_raqueta boolean not null default false;

-- Migrar datos existentes: si tenía has_equipment = true y sport indica pádel o es null, se asume paleta.
-- Es una migración best-effort, el usuario puede corregirlo desde su perfil.
update public.profiles
  set has_paleta = true
  where has_equipment = true
    and (sport = 'padel' or sport = 'ambos' or sport is null);

update public.profiles
  set has_raqueta = true
  where has_equipment = true
    and (sport = 'tenis' or sport = 'ambos');
