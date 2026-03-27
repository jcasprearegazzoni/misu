"use server";

import { registerSchema } from "@/lib/validation/auth.schema";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RegisterActionState = {
  error: string | null;
  success: string | null;
};

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos de registro inválidos.",
      success: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { name, role, email, password } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) {
    return {
      error: translateAuthError(error.message),
      success: null,
    };
  }

  // Si no hay sesion inmediata (confirmacion de email activada),
  // informamos que debe confirmar por email.
  if (!data.session) {
    return {
      error: null,
      success: "Registro creado. Revisa tu email para confirmar la cuenta.",
    };
  }

  // Si hay sesion inmediata (confirmacion desactivada), el alta quedo lista.
  return {
    error: null,
    success: "Registro creado correctamente.",
  };
}
