"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profesorPriceSettingsSchema } from "@/lib/validation/profesor-settings.schema";

export type PriceSettingsActionState = {
  error: string | null;
  success: string | null;
};

export async function saveProfesorPriceSettingsAction(
  _prevState: PriceSettingsActionState,
  formData: FormData,
): Promise<PriceSettingsActionState> {
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
      error: "Solo los profesores pueden editar precios.",
      success: null,
    };
  }

  const parsed = profesorPriceSettingsSchema.safeParse({
    price_individual: formData.get("price_individual"),
    price_dobles: formData.get("price_dobles"),
    price_trio: formData.get("price_trio"),
    price_grupal: formData.get("price_grupal"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para guardar precios.",
      success: null,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      price_individual: parsed.data.price_individual ?? null,
      price_dobles: parsed.data.price_dobles ?? null,
      price_trio: parsed.data.price_trio ?? null,
      price_grupal: parsed.data.price_grupal ?? null,
    })
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/dashboard/profesor/finanzas");
  revalidatePath("/dashboard/profesor/perfil");

  return {
    error: null,
    success: "Parametros financieros actualizados correctamente.",
  };
}
