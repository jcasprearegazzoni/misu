ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS provincia varchar,
  ADD COLUMN IF NOT EXISTS municipio varchar,
  ADD COLUMN IF NOT EXISTS tiene_tenis  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tiene_padel  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_futbol boolean NOT NULL DEFAULT false;
