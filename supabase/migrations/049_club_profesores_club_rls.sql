-- Permisos para que el club vea e invite profesores.

create policy "cp_lectura_club"
  on public.club_profesores for select
  to authenticated
  using (
    exists (
      select 1 from public.clubs
      where clubs.id = club_profesores.club_id
        and clubs.user_id = auth.uid()
    )
  );

create policy "cp_insert_club"
  on public.club_profesores for insert
  to authenticated
  with check (
    exists (
      select 1 from public.clubs
      where clubs.id = club_profesores.club_id
        and clubs.user_id = auth.uid()
    )
  );
