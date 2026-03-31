"use server";

import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const buyPackageSchema = z.object({
  package_id: z.coerce.number().int().positive("Paquete invalido."),
  profesor_id: z.string().uuid("Profesor invalido."),
});

export type BuyPackageActionState = {
  error: string | null;
  success: string | null;
};

export async function buyPackageAction(
  _prevState: BuyPackageActionState,
  formData: FormData,
): Promise<BuyPackageActionState> {
  const parsed = buyPackageSchema.safeParse({
    package_id: formData.get("package_id"),
    profesor_id: formData.get("profesor_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar que el usuario es alumno.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "alumno") {
    return { error: "Solo los alumnos pueden solicitar paquetes.", success: null };
  }

  // Verificar que el paquete existe, está activo y pertenece al profesor.
  const { data: pkg } = await supabase
    .from("packages")
    .select("id, name, total_classes")
    .eq("id", parsed.data.package_id)
    .eq("profesor_id", parsed.data.profesor_id)
    .eq("active", true)
    .single();

  if (!pkg) {
    return { error: "El paquete ya no está disponible.", success: null };
  }

  // Crear el student_package con paid = false (el alumno debe pagar externamente).
  // Los créditos se acumulan: se puede solicitar el mismo paquete más de una vez.
  const { error } = await supabase.from("student_packages").insert({
    alumno_id: user.id,
    package_id: parsed.data.package_id,
    profesor_id: parsed.data.profesor_id,
    classes_remaining: pkg.total_classes,
    paid: false,
  });

  if (error) {
    return { error: "No se pudo procesar la solicitud. Intentá nuevamente.", success: null };
  }

  // Notificar al profesor.
  await createNotification({
    userId: parsed.data.profesor_id,
    type: "package_assigned",
    title: "Solicitud de paquete",
    message: `${profile.name || "Un alumno"} solicitó el paquete "${pkg.name}". Coordiná el pago para activar los créditos.`,
  });

  return {
    error: null,
    success: `Solicitud enviada. Coordiná el pago de "${pkg.name}" con tu profesor para activar los créditos.`,
  };
}
