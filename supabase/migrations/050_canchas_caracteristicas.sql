-- Actualiza las opciones de superficie para contemplar futbol y caracteristicas por deporte.

alter table public.canchas
  drop constraint if exists canchas_superficie_check;

alter table public.canchas
  add constraint canchas_superficie_check
  check (
    superficie in (
      'sintetico',
      'polvo_ladrillo',
      'cemento',
      'blindex',
      'f5',
      'f7',
      'f8',
      'f9',
      'f11'
    )
  );
