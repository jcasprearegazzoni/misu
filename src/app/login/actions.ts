"use server";

import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { getSafeInternalRedirectPath } from "@/lib/navigation/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth.schema";

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

  const role = await getUserRole(data.user.id);

  if (!role) {
    return {
      error: "Login correcto, pero no existe un rol válido en profiles para este usuario.",
    };
  }

  if (role === "alumno") {
    const { data: alumnoProfile } = await supabase
      .from("profiles")
      .select("category")
      .eq("user_id", data.user.id)
      .single();

    if (!alumnoProfile?.category) {
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

  redirect("/dashboard/alumno");
}
