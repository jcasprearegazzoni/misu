-- Agrega la política RLS de INSERT que faltaba en club_profesores.
-- Sin esta política, los profesores no podían crear nuevos clubes placeholder.

create policy "cp_insert_profesor"
  on public.club_profesores for insert
  to authenticated
  with check (auth.uid() = profesor_id);
