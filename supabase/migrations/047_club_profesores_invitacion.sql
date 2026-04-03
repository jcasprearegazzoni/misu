-- Agrega timestamps de invitación y respuesta a club_profesores.

alter table public.club_profesores
  add column if not exists invited_at timestamptz,
  add column if not exists responded_at timestamptz;
