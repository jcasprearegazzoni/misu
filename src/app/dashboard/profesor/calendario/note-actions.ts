"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profesorAlumnoNoteSchema } from "@/lib/validation/profesor-alumno-note.schema";

export type SaveProfesorAlumnoNoteState = {
  error: string | null;
  success: string | null;
};

export async function saveProfesorAlumnoNoteAction(
  _prevState: SaveProfesorAlumnoNoteState,
  formData: FormData,
): Promise<SaveProfesorAlumnoNoteState> {
  const parsed = profesorAlumnoNoteSchema.safeParse({
    alumno_id: formData.get("alumno_id"),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo validar la nota.",
      success: null,
    };
  }

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
    return {
      error: "Solo el profesor puede guardar notas privadas.",
      success: null,
    };
  }

  const { error } = await supabase.from("profesor_alumno_notes").upsert(
    {
      profesor_id: user.id,
      alumno_id: parsed.data.alumno_id,
      note: parsed.data.note,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "profesor_id,alumno_id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    return {
      error: "No se pudo guardar la nota privada.",
      success: null,
    };
  }

  revalidatePath("/dashboard/profesor/calendario");

  return {
    error: null,
    success: "Nota guardada correctamente.",
  };
}
