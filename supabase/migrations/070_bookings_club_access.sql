-- Fix 1: Política RLS para que el club pueda leer bookings de clases en su club
drop policy if exists "bookings_lectura_club" on public.bookings;
create policy "bookings_lectura_club"
  on public.bookings
  for select
  to authenticated
  using (
    club_id in (
      select id from public.clubs
      where user_id = auth.uid()
    )
  );

-- Fix 2: FK de bookings.profesor_id → profiles.user_id
-- Necesario para que PostgREST pueda hacer el join profiles!profesor_id(name)
alter table public.bookings
  drop constraint if exists bookings_profesor_id_profiles_fkey;

alter table public.bookings
  add constraint bookings_profesor_id_profiles_fkey
    foreign key (profesor_id) references public.profiles(user_id) on delete cascade;
