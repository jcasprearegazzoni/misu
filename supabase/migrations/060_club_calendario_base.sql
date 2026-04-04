-- Habilitar extension para constraints de exclusion (anti-solapamiento)
create extension if not exists btree_gist;

-- Configuracion general del club
create table if not exists public.club_configuracion (
  club_id integer primary key references public.clubs(id) on delete cascade,
  confirmacion_automatica boolean not null default true,
  cancelacion_horas_limite integer not null default 24,
  updated_at timestamptz not null default now()
);

alter table public.club_configuracion enable row level security;

drop policy if exists "club_config_lectura_propia" on public.club_configuracion;
create policy "club_config_lectura_propia"
  on public.club_configuracion for select
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

drop policy if exists "club_config_escritura_propia" on public.club_configuracion;
create policy "club_config_escritura_propia"
  on public.club_configuracion for all
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()))
  with check (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

-- Disponibilidad por tramo: club + deporte + dia + franja horaria
create table if not exists public.club_disponibilidad (
  id serial primary key,
  club_id integer not null references public.clubs(id) on delete cascade,
  deporte text not null check (deporte in ('tenis', 'padel', 'futbol', 'otro')),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  apertura time not null,
  cierre time not null,
  duraciones integer[] not null default '{60}',
  constraint club_disponibilidad_unique unique (club_id, deporte, day_of_week, apertura),
  constraint cierre_mayor_apertura check (cierre > apertura)
);

alter table public.club_disponibilidad enable row level security;

drop policy if exists "club_disp_lectura_publica" on public.club_disponibilidad;
create policy "club_disp_lectura_publica"
  on public.club_disponibilidad for select
  to anon, authenticated
  using (true);

drop policy if exists "club_disp_escritura_propia" on public.club_disponibilidad;
create policy "club_disp_escritura_propia"
  on public.club_disponibilidad for all
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()))
  with check (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

-- Precios por franja + duracion + deporte
create table if not exists public.club_franjas_precio (
  id serial primary key,
  club_id integer not null references public.clubs(id) on delete cascade,
  deporte text not null check (deporte in ('tenis', 'padel', 'futbol', 'otro')),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  desde time not null,
  hasta time not null,
  duracion_minutos integer not null check (duracion_minutos in (60, 90, 120)),
  precio numeric(10,2) not null check (precio >= 0),
  constraint club_franjas_unique unique (club_id, deporte, day_of_week, desde, duracion_minutos),
  constraint hasta_mayor_desde check (hasta > desde)
);

alter table public.club_franjas_precio enable row level security;

drop policy if exists "club_franjas_lectura_publica" on public.club_franjas_precio;
create policy "club_franjas_lectura_publica"
  on public.club_franjas_precio for select
  to anon, authenticated
  using (true);

drop policy if exists "club_franjas_escritura_propia" on public.club_franjas_precio;
create policy "club_franjas_escritura_propia"
  on public.club_franjas_precio for all
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()))
  with check (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

-- Asegura referencia compuesta (club_id, cancha_id) valida en reservas
create unique index if not exists canchas_club_id_id_unique on public.canchas (club_id, id);

-- Reservas de cancha
create table if not exists public.reservas_cancha (
  id serial primary key,
  club_id integer not null references public.clubs(id) on delete cascade,
  cancha_id integer not null,
  deporte text not null check (deporte in ('tenis', 'padel', 'futbol', 'otro')),
  fecha date not null,
  hora_inicio time not null,
  duracion_minutos integer not null check (duracion_minutos > 0),
  hora_fin time generated always as (hora_inicio + make_interval(mins => duracion_minutos)) stored,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'cancelada')),
  tipo text not null default 'alquiler' check (tipo in ('alquiler', 'clase')),
  profesor_id uuid references public.profiles(user_id) on delete set null,
  confirmacion_auto boolean not null default true,
  created_at timestamptz not null default now(),
  constraint reservas_cancha_club_cancha_fkey
    foreign key (club_id, cancha_id)
    references public.canchas(club_id, id)
    on delete cascade
);

-- Anti-solapamiento: dos reservas activas no pueden solaparse en la misma cancha
alter table public.reservas_cancha
  drop constraint if exists reservas_cancha_no_overlap;
alter table public.reservas_cancha
  add constraint reservas_cancha_no_overlap
  exclude using gist (
    cancha_id with =,
    tsrange(
      (fecha + hora_inicio),
      (
        fecha
        + hora_fin
        + case when hora_fin <= hora_inicio then interval '1 day' else interval '0' end
      ),
      '[)'
    ) with &&
  ) where (estado in ('pendiente', 'confirmada'));

create index if not exists reservas_cancha_fecha_idx on public.reservas_cancha (club_id, fecha);
create index if not exists reservas_cancha_cancha_idx on public.reservas_cancha (cancha_id, fecha);

alter table public.reservas_cancha enable row level security;

drop policy if exists "reservas_lectura_club" on public.reservas_cancha;
create policy "reservas_lectura_club"
  on public.reservas_cancha for select
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

drop policy if exists "reservas_insert_public" on public.reservas_cancha;
create policy "reservas_insert_public"
  on public.reservas_cancha for insert
  to anon, authenticated
  with check (true);

drop policy if exists "reservas_update_club" on public.reservas_cancha;
create policy "reservas_update_club"
  on public.reservas_cancha for update
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()))
  with check (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

-- Participantes de una reserva
create table if not exists public.reserva_participantes (
  id serial primary key,
  reserva_id integer not null references public.reservas_cancha(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  nombre text not null,
  telefono text,
  email text,
  es_organizador boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reserva_participantes enable row level security;

drop policy if exists "participantes_lectura_club" on public.reserva_participantes;
create policy "participantes_lectura_club"
  on public.reserva_participantes for select
  to authenticated
  using (exists (
    select 1 from public.reservas_cancha rc
    join public.clubs c on c.id = rc.club_id
    where rc.id = reserva_id and c.user_id = auth.uid()
  ));

drop policy if exists "participantes_insert_public" on public.reserva_participantes;
create policy "participantes_insert_public"
  on public.reserva_participantes for insert
  to anon, authenticated
  with check (true);

-- Movimientos de cancha (finanzas club ↔ profesor)
create table if not exists public.movimientos_cancha (
  id serial primary key,
  reserva_id integer not null references public.reservas_cancha(id) on delete cascade,
  club_id integer not null references public.clubs(id) on delete cascade,
  profesor_id uuid not null references public.profiles(user_id) on delete cascade,
  monto numeric(10,2) not null,
  modo text not null check (modo in ('fixed_per_hour', 'per_student_percentage')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'cobrado')),
  created_at timestamptz not null default now()
);

alter table public.movimientos_cancha enable row level security;

drop policy if exists "movimientos_lectura_club" on public.movimientos_cancha;
create policy "movimientos_lectura_club"
  on public.movimientos_cancha for select
  to authenticated
  using (exists (select 1 from public.clubs where clubs.id = club_id and clubs.user_id = auth.uid()));

drop policy if exists "movimientos_lectura_profesor" on public.movimientos_cancha;
create policy "movimientos_lectura_profesor"
  on public.movimientos_cancha for select
  to authenticated
  using (auth.uid() = profesor_id);

-- Abrir canchas a lectura anonima (necesario para perfil publico del club)
drop policy if exists "canchas_lectura_autenticados" on public.canchas;
drop policy if exists "canchas_lectura_publica" on public.canchas;
create policy "canchas_lectura_publica"
  on public.canchas for select
  to anon, authenticated
  using (true);

-- Agregar club_id y cancha_id a bookings para vincular clases con reservas de cancha
alter table public.bookings
  add column if not exists club_id integer references public.clubs(id) on delete set null,
  add column if not exists cancha_id integer references public.canchas(id) on delete set null;
