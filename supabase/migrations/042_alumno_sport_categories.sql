-- Agrega deporte del alumno y categorías separadas por disciplina.
-- category existente se renombra a category_padel.
-- Se agrega category_tenis y sport para el alumno.

alter table public.profiles
  rename column category to category_padel;

alter table public.profiles
  add column if not exists category_tenis text,
  add column if not exists sport text;

-- Constraints básicos de no vacío.
alter table public.profiles
  drop constraint if exists profiles_category_tenis_check;
alter table public.profiles
  add constraint profiles_category_tenis_check
  check (category_tenis is null or length(trim(category_tenis)) > 0);

alter table public.profiles
  drop constraint if exists profiles_sport_alumno_check;
alter table public.profiles
  add constraint profiles_sport_alumno_check
  check (sport is null or sport in ('tenis', 'padel', 'ambos'));
