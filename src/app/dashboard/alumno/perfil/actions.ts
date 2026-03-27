"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { alumnoProfileSchema } from "@/lib/validation/alumno-profile.schema";

export type AlumnoPerfilActionState = {
  error: string | null;
  success: string | null;
};

export async function saveAlumnoProfileAction(
  _prevState: AlumnoPerfilActionState,
  formData: FormData,
): Promise<AlumnoPerfilActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "alumno") {
    return {
      error: "Solo los alumnos pueden editar este perfil.",
      success: null,
    };
  }

  const parsed = alumnoProfileSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    branch: formData.get("branch"),
    has_equipment: formData.get("has_equipment"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para guardar el perfil.",
      success: null,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      branch: parsed.data.branch,
      has_equipment: parsed.data.has_equipment,
    })
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/dashboard/alumno/perfil");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath("/dashboard/alumno/turnos");

  return {
    error: null,
    success: "Perfil actualizado correctamente.",
  };
}
