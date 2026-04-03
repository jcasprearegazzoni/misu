-- Campo para vincular la fusión con un placeholder
ALTER TABLE public.club_profesores
  ADD COLUMN IF NOT EXISTS merged_from_club_id INTEGER REFERENCES public.clubs(id) ON DELETE SET NULL;
