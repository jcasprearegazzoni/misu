"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetupPasswordActionState = {
  error: string | null;
};

export async function setupPasswordAction(
  _prev: SetupPasswordActionState,
  formData: FormData,
): Promise<SetupPasswordActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "No se pudo guardar la contraseña." };
  }

  redirect("/");
}
