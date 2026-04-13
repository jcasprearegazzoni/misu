"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignStudentProgramSchema,
  createProgramSchema,
  markStudentProgramPaidSchema,
} from "@/lib/validation/programs.schema";
import { z } from "zod";

export type ProgramActionState = {
  error: string | null;
  success: string | null;
};

async function requireProfesor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "profesor") {
    return null;
  }

  return { supabase, userId: user.id };
}

export async function createProgramAction(
  _prevState: ProgramActionState,
  formData: FormData,
): Promise<ProgramActionState> {
  const context = await requireProfesor();

  if (!context) {
    return { error: "Solo los profesores pueden crear programas.", success: null };
  }

  // dias_semana viene como múltiples valores del mismo campo.
  const diasRaw = formData.getAll("dias_semana").map((value) => Number(value));

  const parsed = createProgramSchema.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    categoria: formData.get("categoria"),
    nivel: formData.get("nivel"),
    deporte: formData.get("deporte"),
    tipo_clase: formData.get("tipo_clase"),
    total_clases: formData.get("total_clases"),
    precio: formData.get("precio"),
    cupo_max: formData.get("cupo_max") || null,
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
    dias_semana: diasRaw,
    hora_inicio: formData.get("hora_inicio"),
    hora_fin: formData.get("hora_fin"),
    visibilidad: formData.get("visibilidad"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos para crear el programa.",
      success: null,
    };
  }

  const { error } = await context.supabase.from("programs").insert({
    profesor_id: context.userId,
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion ?? null,
    categoria: parsed.data.categoria ?? null,
    nivel: parsed.data.nivel,
    deporte: parsed.data.deporte,
    tipo_clase: parsed.data.tipo_clase,
    total_clases: parsed.data.total_clases,
    precio: parsed.data.precio,
    cupo_max: parsed.data.cupo_max ?? null,
    fecha_inicio: parsed.data.fecha_inicio,
    fecha_fin: parsed.data.fecha_fin,
    dias_semana: parsed.data.dias_semana,
    hora_inicio: parsed.data.hora_inicio,
    hora_fin: parsed.data.hora_fin,
    visibilidad: parsed.data.visibilidad,
    estado: "activo",
    active: true,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/dashboard/profesor/programas");
  return { error: null, success: "Programa creado correctamente." };
}

export async function assignProgramToStudentAction(
  _prevState: ProgramActionState,
  formData: FormData,
): Promise<ProgramActionState> {
  const context = await requireProfesor();

  if (!context) {
    return { error: "Solo los profesores pueden asignar programas.", success: null };
  }

  const parsed = assignStudentProgramSchema.safeParse({
    alumno_id: formData.get("alumno_id"),
    program_id: formData.get("program_id"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos para inscribir al alumno.",
      success: null,
    };
  }

  // Verificar que el programa pertenece al profesor y está activo.
  const { data: programa } = await context.supabase
    .from("programs")
    .select("id, nombre, total_clases, cupo_max")
    .eq("id", parsed.data.program_id)
    .eq("profesor_id", context.userId)
    .eq("active", true)
    .single();

  if (!programa) {
    return { error: "El programa seleccionado no existe o no está activo.", success: null };
  }

  // Verificar cupo si está definido.
  if (programa.cupo_max !== null) {
    const { count } = await context.supabase
      .from("student_programs")
      .select("id", { count: "exact", head: true })
      .eq("program_id", programa.id)
      .eq("paid", true);

    if ((count ?? 0) >= programa.cupo_max) {
      return { error: "El programa no tiene cupo disponible.", success: null };
    }
  }

  // Inscribir al alumno (classes_remaining se actualiza por la RPC).
  const { data: inscripcion, error: insertError } = await context.supabase
    .from("student_programs")
    .insert({
      alumno_id: parsed.data.alumno_id,
      program_id: programa.id,
      profesor_id: context.userId,
      classes_remaining: 0,
      paid: false,
      origen: "manual",
    })
    .select("id")
    .single();

  if (insertError || !inscripcion) {
    return { error: insertError?.message ?? "No se pudo inscribir al alumno.", success: null };
  }

  // Generar automáticamente todos los bookings del período.
  const { error: rpcError } = await context.supabase.rpc("generate_program_bookings", {
    p_student_program_id: inscripcion.id,
    p_profesor_id: context.userId,
  });

  if (rpcError) {
    return {
      error: `Alumno inscrito pero no se pudieron generar las clases: ${rpcError.message}`,
      success: null,
    };
  }

  // Notificar al alumno.
  await createNotification({
    userId: parsed.data.alumno_id,
    type: "package_assigned",
    title: "Inscripción a programa",
    message: `Tu profesor te inscribió en el programa "${programa.nombre}". Se generaron todas las clases del período.`,
  });

  revalidatePath("/dashboard/profesor/programas");
  return { error: null, success: "Alumno inscrito y clases generadas correctamente." };
}

export async function markStudentProgramPaidAction(formData: FormData) {
  const context = await requireProfesor();

  if (!context) {
    return;
  }

  const parsed = markStudentProgramPaidSchema.safeParse({
    student_program_id: formData.get("student_program_id"),
  });

  if (!parsed.success) {
    return;
  }

  await context.supabase
    .from("student_programs")
    .update({ paid: true })
    .eq("id", parsed.data.student_program_id)
    .eq("profesor_id", context.userId);

  revalidatePath("/dashboard/profesor/programas");
}

const deactivateProgramSchema = z.object({
  program_id: z.coerce.number().int().positive("Programa inválido."),
});

export async function deactivateProgramAction(formData: FormData) {
  const context = await requireProfesor();

  if (!context) {
    return;
  }

  const parsed = deactivateProgramSchema.safeParse({
    program_id: formData.get("program_id"),
  });

  if (!parsed.success) {
    return;
  }

  await context.supabase
    .from("programs")
    .update({ active: false })
    .eq("id", parsed.data.program_id)
    .eq("profesor_id", context.userId)
    .eq("active", true);

  revalidatePath("/dashboard/profesor/programas");
}
