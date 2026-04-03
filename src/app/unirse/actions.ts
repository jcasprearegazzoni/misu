"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clubLeadSchema } from "@/lib/validation/club-lead.schema";

export type UnirseActionState = {
  error: string | null;
  success: boolean;
  invalidField: "nombre" | "direccion" | "cuit" | "email" | "telefono" | "mensaje" | null;
};

export async function enviarSolicitudClubAction(
  _prev: UnirseActionState,
  formData: FormData,
): Promise<UnirseActionState> {
  const parsed = clubLeadSchema.safeParse({
    nombre: formData.get("nombre"),
    direccion: formData.get("direccion"),
    cuit: formData.get("cuit"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    mensaje: formData.get("mensaje"),
  });

  if (!parsed.success) {
    const invalidField = parsed.error.issues[0]?.path[0];

    return {
      error: parsed.error.issues[0]?.message ?? "Revisá los datos.",
      success: false,
      invalidField:
        invalidField === "nombre" ||
        invalidField === "direccion" ||
        invalidField === "cuit" ||
        invalidField === "email" ||
        invalidField === "telefono" ||
        invalidField === "mensaje"
          ? invalidField
          : null,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("club_leads").insert({
    nombre: parsed.data.nombre,
    direccion: parsed.data.direccion,
    cuit: parsed.data.cuit,
    email: parsed.data.email,
    telefono: parsed.data.telefono,
    mensaje: parsed.data.mensaje ?? null,
  });

  if (error) {
    return {
      error: "No se pudo enviar la solicitud. Intentá nuevamente.",
      success: false,
      invalidField: null,
    };
  }

  return { error: null, success: true, invalidField: null };
}
