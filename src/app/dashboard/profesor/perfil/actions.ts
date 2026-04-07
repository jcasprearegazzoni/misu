"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profesorProfileSchema } from "@/lib/validation/profesor-profile.schema";
import { generateUniqueUsername } from "@/lib/utils/generate-username";

export type PerfilProfesorActionState = {
  error: string | null;
  success: string | null;
};

export async function saveProfesorProfileAction(
  _prevState: PerfilProfesorActionState,
  formData: FormData,
): Promise<PerfilProfesorActionState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("user_id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "profesor") {
    return {
      error: "Solo los profesores pueden editar este perfil.",
      success: null,
    };
  }

  const parsed = profesorProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    sport: formData.get("sport"),
    provincia: formData.get("provincia"),
    municipio: formData.get("municipio"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "RevisÃ¡ los datos e intentÃ¡ nuevamente.",
      success: null,
    };
  }

  // Preservar username existente. Si no tiene, auto-generar desde el nombre.
  let username = currentProfile.username ?? null;
  if (!username) {
    username = await generateUniqueUsername(parsed.data.name, async (candidate) => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", candidate)
        .neq("user_id", user.id)
        .maybeSingle();
      return !!data;
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      username,
      bio: parsed.data.bio ?? null,
      sport: parsed.data.sport,
      provincia: parsed.data.provincia,
      zone: parsed.data.municipio,
    })
    .eq("user_id", user.id);

  if (error) {
    return {
      error: "No se pudo guardar el perfil. RevisÃ¡ los datos e intentÃ¡ nuevamente.",
      success: null,
    };
  }

  revalidatePath("/dashboard/profesor/ajustes");

  redirect("/dashboard/profesor/ajustes?updated=1");
}

