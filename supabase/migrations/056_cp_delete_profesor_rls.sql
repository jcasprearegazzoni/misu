-- Permite al profesor eliminar su propia relación con un club (abandonar).
CREATE POLICY "cp_delete_profesor"
  ON public.club_profesores FOR DELETE
  TO authenticated
  USING (auth.uid() = profesor_id);
