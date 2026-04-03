-- Permite que el club elimine invitaciones pendientes.
CREATE POLICY "cp_delete_club"
  ON public.club_profesores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_profesores.club_id
        AND clubs.user_id = auth.uid()
    )
  );
