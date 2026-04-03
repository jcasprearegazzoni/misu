-- Reestructura clubs como entidad independiente y crea club_profesores.
-- Los costos de cancha se mueven de clubs a club_profesores (son un trato por relación).

-- 1. Agregar rol 'club' al check constraint de profiles.
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('profesor', 'alumno', 'club'));

-- Actualizar el trigger handle_new_user para aceptar el nuevo rol.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
  selected_name text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role', 'alumno');

  if selected_role not in ('profesor', 'alumno', 'club') then
    selected_role := 'alumno';
  end if;

  selected_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');

  if selected_name is null then
    selected_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (user_id, role, name)
  values (new.id, selected_role, selected_name);

  return new;
end;
$$;

-- 2. Agregar nuevas columnas a clubs antes de eliminar las viejas.
alter table public.clubs
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists is_placeholder boolean not null default true,
  add column if not exists created_by_profesor_id uuid references auth.users(id) on delete set null;

-- 3. Migrar datos: copiar profesor_id a created_by_profesor_id.
update public.clubs
  set is_placeholder = true,
      created_by_profesor_id = profesor_id
  where profesor_id is not null;

-- 4. Crear tabla club_profesores.
create table if not exists public.club_profesores (
  id serial primary key,
  club_id integer not null references public.clubs(id) on delete cascade,
  profesor_id uuid not null references auth.users(id) on delete cascade,
  court_cost_mode text not null default 'fixed_per_hour'
    check (court_cost_mode in ('fixed_per_hour', 'per_student_percentage')),
  court_cost_per_hour numeric(10,2),
  court_percentage_per_student numeric(5,2),
  status text not null default 'activo'
    check (status in ('pendiente', 'activo', 'inactivo')),
  created_at timestamptz not null default now(),
  unique(club_id, profesor_id)
);

alter table public.club_profesores enable row level security;

-- 5. Migrar datos: cada club existente genera un registro en club_profesores.
insert into public.club_profesores (
  club_id, profesor_id, court_cost_mode,
  court_cost_per_hour, court_percentage_per_student, status
)
select
  id,
  profesor_id,
  court_cost_mode,
  court_cost_per_hour,
  court_percentage_per_student,
  'activo'
from public.clubs
where profesor_id is not null
on conflict (club_id, profesor_id) do nothing;

-- 6. Eliminar políticas viejas de clubs antes de quitar columnas dependientes.
drop policy if exists "profesores_ven_sus_clubes" on public.clubs;
drop policy if exists "profesores_insertan_sus_clubes" on public.clubs;
drop policy if exists "profesores_actualizan_sus_clubes" on public.clubs;
drop policy if exists "profesores_eliminan_sus_clubes" on public.clubs;

-- 7. Eliminar columnas viejas de clubs.
alter table public.clubs
  drop column if exists profesor_id,
  drop column if exists court_cost_mode,
  drop column if exists court_cost_per_hour,
  drop column if exists court_percentage_per_student;

-- 8. Actualizar RLS de clubs.
-- Lectura: cualquier usuario autenticado puede ver clubes (alumno ve nombre/dirección).
create policy "clubs_lectura_autenticados"
  on public.clubs for select
  to authenticated
  using (true);

-- Inserción: solo profesores crean placeholders (ellos son created_by_profesor_id).
create policy "profesor_crea_placeholder"
  on public.clubs for insert
  to authenticated
  with check (auth.uid() = created_by_profesor_id and is_placeholder = true);

-- Actualización: el creador edita su placeholder, o el club edita el suyo.
create policy "clubs_update"
  on public.clubs for update
  to authenticated
  using (auth.uid() = created_by_profesor_id or auth.uid() = user_id)
  with check (auth.uid() = created_by_profesor_id or auth.uid() = user_id);

-- Eliminación: solo el profesor que lo creó puede eliminar su placeholder.
create policy "profesor_elimina_placeholder"
  on public.clubs for delete
  to authenticated
  using (auth.uid() = created_by_profesor_id and is_placeholder = true);

-- 9. RLS de club_profesores.
create policy "cp_lectura_propia_profesor"
  on public.club_profesores for select
  to authenticated
  using (auth.uid() = profesor_id);

create policy "cp_insert_profesor"
  on public.club_profesores for insert
  to authenticated
  with check (auth.uid() = profesor_id);

create policy "cp_update_profesor"
  on public.club_profesores for update
  to authenticated
  using (auth.uid() = profesor_id)
  with check (auth.uid() = profesor_id);

-- 10. Actualizar RPC (sin cambios en la firma, sigue funcionando igual).
drop function if exists public.get_profesor_weekly_availability(uuid);

create function public.get_profesor_weekly_availability(
  p_profesor_id uuid
)
returns table (
  day_of_week smallint,
  start_time time,
  end_time time,
  slot_duration_minutes integer,
  club_id integer,
  club_nombre text
)
language sql
security definer
set search_path = public
as $$
  select
    a.day_of_week,
    a.start_time,
    a.end_time,
    a.slot_duration_minutes,
    a.club_id,
    c.nombre as club_nombre
  from public.availability a
  left join public.clubs c on c.id = a.club_id
  where a.profesor_id = p_profesor_id
  order by a.day_of_week, a.start_time;
$$;

revoke all on function public.get_profesor_weekly_availability(uuid) from public;
grant execute on function public.get_profesor_weekly_availability(uuid) to authenticated;
