"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profesorOperationalSettingsSchema } from "@/lib/validation/profesor-settings.schema";

export type ProfesorSettingsActionState = {
  error: string | null;
  success: string | null;
};

export async function saveProfesorOperationalSettingsAction(
  _prevState: ProfesorSettingsActionState,
  formData: FormData,
): Promise<ProfesorSettingsActionState> {
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
      error: "Solo los profesores pueden editar esta configuración.",
      success: null,
    };
  }

  const parsed = profesorOperationalSettingsSchema.safeParse({
    cancel_without_charge_hours: formData.get("cancel_without_charge_hours"),
    solo_warning_hours: formData.get("solo_warning_hours"),
    solo_decision_deadline_minutes: formData.get("solo_decision_deadline_minutes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos para la configuración.",
      success: null,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      cancel_without_charge_hours: parsed.data.cancel_without_charge_hours ?? null,
      solo_warning_hours: parsed.data.solo_warning_hours ?? null,
      solo_decision_deadline_minutes: parsed.data.solo_decision_deadline_minutes ?? null,
    })
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/dashboard/profesor/perfil");
  revalidatePath("/dashboard/profesor/configuracion");
  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/profesor/reservas");

  return {
    error: null,
    success: "Configuración guardada correctamente.",
  };
}
