"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SaveGatewayConfigInput = {
  enabled: boolean;
  gateway: "mercadopago";
  accessToken: string | null;
};

export async function saveProfesorGatewayConfig(
  data: SaveGatewayConfigInput,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  // Actualiza configuracion base y token solo cuando llega un valor nuevo.
  const updatePayload: {
    payment_gateway_enabled: boolean;
    payment_gateway: "mercadopago";
    payment_gateway_access_token?: string;
  } = {
    payment_gateway_enabled: data.enabled,
    payment_gateway: data.gateway,
  };

  if (data.accessToken !== null) {
    updatePayload.payment_gateway_access_token = data.accessToken;
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", user.id)
    .eq("role", "profesor")
    .select("user_id")
    .maybeSingle();

  if (error) {
    return { error: "No se pudo guardar la configuración de pagos online." };
  }

  if (!updatedProfile) {
    return { error: "No autorizado para actualizar esta configuración." };
  }

  return {};
}
