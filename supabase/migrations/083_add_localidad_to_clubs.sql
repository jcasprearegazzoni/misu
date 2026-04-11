-- Agrega columna localidad a clubs para filtrado geográfico de tercer nivel.
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS localidad varchar;
