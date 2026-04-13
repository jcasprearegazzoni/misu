-- Corrige RPC generate_program_bookings para webhook service_role y programas de club.
create or replace function public.generate_program_bookings(
  p_student_program_id bigint,
  p_profesor_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sp     record;
  v_prog   record;
  v_date   date;
  v_dow    int;
  v_count  int := 0;
begin
  -- Solo el profesor dueño puede llamar esta función.
  if auth.uid() is not null and auth.uid() is distinct from p_profesor_id then
    raise exception 'No autorizado para generar clases de este profesor.';
  end if;

  -- Obtener inscripción.
  select *
    into v_sp
  from public.student_programs
  where id = p_student_program_id;

  if not found then
    raise exception 'Inscripción no encontrada: student_program_id=%', p_student_program_id;
  end if;

  -- Obtener programa.
  select *
    into v_prog
  from public.programs
  where id = v_sp.program_id;

  if not found then
    raise exception 'Programa no encontrado: program_id=%', v_sp.program_id;
  end if;

  -- Iterar sobre cada día del rango fecha_inicio..fecha_fin.
  v_date := v_prog.fecha_inicio;

  while v_date <= v_prog.fecha_fin loop
    -- EXTRACT(DOW FROM date): 0=Dom, 1=Lun, ..., 6=Sab.
    v_dow := extract(dow from v_date)::int;

    if v_dow = any(v_prog.dias_semana) then
      insert into public.bookings (
        profesor_id,
        alumno_id,
        date,
        start_time,
        end_time,
        type,
        status,
        student_program_id
      ) values (
        coalesce(v_sp.profesor_id, p_profesor_id),
        v_sp.alumno_id,
        v_date,
        v_prog.hora_inicio,
        v_prog.hora_fin,
        v_prog.tipo_clase,
        'confirmado',
        p_student_program_id
      );
      v_count := v_count + 1;
    end if;

    v_date := v_date + interval '1 day';
  end loop;

  -- Actualizar el contador de clases restantes con los bookings generados.
  update public.student_programs
  set classes_remaining = v_count
  where id = p_student_program_id;

  return v_count;
end;
$$;

revoke all on function public.generate_program_bookings(bigint, uuid) from public;
revoke all on function public.generate_program_bookings(bigint, uuid) from anon;
grant execute on function public.generate_program_bookings(bigint, uuid) to authenticated;
