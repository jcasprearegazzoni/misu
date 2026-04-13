"use server";

import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SaveGatewayConfigInput = {
  enabled: boolean;
  gateway: "mercadopago";
  accessToken: string | null;
};

export async function saveClubGatewayConfig(data: SaveGatewayConfigInput): Promise<{ error?: string }> {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();

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

  const { error } = await supabase
    .from("club_configuracion")
    .update(updatePayload)
    .eq("club_id", club.id);

  if (error) {
    return { error: "No se pudo guardar la configuración de pagos online del club." };
  }

  return {};
}
