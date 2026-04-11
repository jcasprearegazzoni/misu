-- Mejora joins por reserva al buscar participantes por reserva_id.
create index if not exists idx_reserva_participantes_reserva_id
  on reserva_participantes(reserva_id);

-- Acelera consultas del historial/participaciones filtradas por usuario.
create index if not exists idx_reserva_participantes_user_id
  on reserva_participantes(user_id);

-- Optimiza joins y filtros de profesores por club.
create index if not exists idx_club_profesores_club_id
  on club_profesores(club_id);

-- Optimiza joins y filtros de clubes por profesor.
create index if not exists idx_club_profesores_profesor_id
  on club_profesores(profesor_id);

-- Reduce costo de consultas de canchas dentro de un club.
create index if not exists idx_canchas_club_id
  on canchas(club_id);

-- Acelera filtros de bookings por contexto de club.
create index if not exists idx_bookings_club_id
  on bookings(club_id);

-- Mejora el listado de clases del alumno filtrando por estado.
create index if not exists idx_bookings_alumno_id_status
  on bookings(alumno_id, status);

-- Optimiza agendas por club/fecha en estados activos sin indexar cancelados.
create index if not exists idx_bookings_club_id_date_status
  on bookings(club_id, date, status)
  where status in ('pendiente', 'confirmado');

-- Acelera disponibilidad de reservas de cancha por club, fecha y estado.
create index if not exists idx_reservas_cancha_club_fecha_estado
  on reservas_cancha(club_id, fecha, estado);

-- Mejora consultas de pagos asociados a un alumno.
create index if not exists idx_payments_alumno_id
  on payments(alumno_id);

-- Acelera consultas de paquetes comprados por alumno.
create index if not exists idx_student_packages_alumno_id
  on student_packages(alumno_id);
