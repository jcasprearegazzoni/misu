"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profesorProfileSchema } from "@/lib/validation/profesor-profile.schema";

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
    .select("role")
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
    username: formData.get("username"),
    avatar_url: formData.get("avatar_url"),
    bio: formData.get("bio"),
    sport: formData.get("sport"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para el perfil.",
      success: null,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      username: parsed.data.username ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
      bio: parsed.data.bio ?? null,
      sport: parsed.data.sport,
    })
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  return {
    error: null,
    success: "Perfil actualizado correctamente.",
  };
}
