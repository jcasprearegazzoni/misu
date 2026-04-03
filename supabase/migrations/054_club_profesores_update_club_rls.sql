-- Permite que el club actualice el estado de invitaciones.
CREATE POLICY "cp_update_club"
  ON public.club_profesores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_profesores.club_id
        AND clubs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_profesores.club_id
        AND clubs.user_id = auth.uid()
    )
  );
