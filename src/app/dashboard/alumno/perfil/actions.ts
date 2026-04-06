"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeInternalRedirectPath } from "@/lib/navigation/safe-redirect";
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
  const safeRedirectTo = getSafeInternalRedirectPath(formData.get("redirectTo"));
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
    sport: formData.get("sport"),
    category_padel: formData.get("category_padel"),
    category_tenis: formData.get("category_tenis"),
    branch: formData.get("branch"),
    provincia: formData.get("provincia"),
    municipio: formData.get("municipio"),
    localidad: formData.get("localidad"),
    celular: formData.get("celular"),
    has_paleta: formData.get("has_paleta"),
    has_raqueta: formData.get("has_raqueta"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisá los datos e intentá nuevamente.",
      success: null,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      sport: parsed.data.sport,
      category_padel: parsed.data.category_padel ?? null,
      category_tenis: parsed.data.category_tenis ?? null,
      branch: parsed.data.branch,
      provincia: parsed.data.provincia,
      zone: parsed.data.municipio,
      localidad: parsed.data.localidad ?? null,
      celular: parsed.data.celular ?? null,
      has_paleta: parsed.data.has_paleta,
      has_raqueta: parsed.data.has_raqueta,
    })
    .eq("user_id", user.id);

  if (error) {
    return {
      error: "No se pudo guardar el perfil. Revisá los datos e intentá nuevamente.",
      success: null,
    };
  }

  revalidatePath("/dashboard/alumno/perfil");
  revalidatePath("/dashboard/alumno/turnos");

  if (safeRedirectTo) {
    redirect(safeRedirectTo);
  }
  redirect("/dashboard/alumno/perfil?updated=1");
}
