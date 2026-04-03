-- Agrega FK entre club_profesores.profesor_id y profiles para habilitar JOINs via PostgREST.
ALTER TABLE public.club_profesores
  ADD CONSTRAINT club_profesores_profesor_profile_fkey
  FOREIGN KEY (profesor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
