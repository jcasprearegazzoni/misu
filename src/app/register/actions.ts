"use server";

import { headers } from "next/headers";
import { registerSchema } from "@/lib/validation/auth.schema";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RegisterActionState = {
  error: string | null;
  success: string | null;
};

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function getAppBaseUrl() {
  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host");
  const forwardedProto = h.get("x-forwarded-proto");
  const host = h.get("host");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  if (host) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL);
  }

  return "http://localhost:3000";
}

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
  const baseUrl = await getAppBaseUrl();
  const emailRedirectTo = `${trimTrailingSlash(baseUrl)}/auth/callback?next=${encodeURIComponent("/login?verified=1")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
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
