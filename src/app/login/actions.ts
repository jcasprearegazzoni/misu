"use server";

import { redirect } from "next/navigation";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { getSafeInternalRedirectPath } from "@/lib/navigation/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth.schema";
import { ROLE_VALUES, type Role } from "@/types/role";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const safeRedirectTo = getSafeInternalRedirectPath(formData.get("redirectTo"));

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Credenciales inválidas.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: translateAuthError(error.message),
    };
  }

  if (!data.user) {
    return {
      error: "No se pudo obtener el usuario autenticado.",
    };
  }

  const { data: roleData, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  const role =
    !roleError && roleData?.role && ROLE_VALUES.includes(roleData.role as Role)
      ? (roleData.role as Role)
      : null;

  if (!role) {
    return {
      error: "Login correcto, pero no existe un rol válido en profiles para este usuario.",
    };
  }

  if (role === "alumno") {
    const { data: alumnoProfile } = await supabase
      .from("profiles")
      .select("sport, category_padel, category_tenis")
      .eq("user_id", data.user.id)
      .single();

    const sport = alumnoProfile?.sport;
    const requiresPadel = sport === "padel" || sport === "ambos" || !sport;
    const requiresTenis = sport === "tenis" || sport === "ambos";
    const hasPadelCategory = Boolean(alumnoProfile?.category_padel);
    const hasTenisCategory = Boolean(alumnoProfile?.category_tenis);

    if ((requiresPadel && !hasPadelCategory) || (requiresTenis && !hasTenisCategory)) {
      if (safeRedirectTo) {
        redirect(`/dashboard/alumno/perfil?redirectTo=${encodeURIComponent(safeRedirectTo)}`);
      }
      redirect("/dashboard/alumno/perfil");
    }
  }

  if (safeRedirectTo) {
    redirect(safeRedirectTo);
  }

  if (role === "profesor") {
    redirect("/dashboard/profesor");
  }

  if (role === "club") {
    redirect("/dashboard/club");
  }

  if (role === "admin") {
    redirect("/admin/leads");
  }

  redirect("/dashboard/alumno");
}
