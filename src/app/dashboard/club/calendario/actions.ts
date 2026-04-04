"use server";

import { revalidatePath } from "next/cache";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmarReservaAction(formData: FormData) {
  const club = await requireClub();
  const reservaId = Number(formData.get("reserva_id"));
  if (!Number.isInteger(reservaId) || reservaId <= 0) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("reservas_cancha")
    .update({ estado: "confirmada" })
    .eq("id", reservaId)
    .eq("club_id", club.id);

  revalidatePath("/dashboard/club/calendario");
}

export async function cancelarReservaAction(formData: FormData) {
  const club = await requireClub();
  const reservaId = Number(formData.get("reserva_id"));
  if (!Number.isInteger(reservaId) || reservaId <= 0) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("reservas_cancha")
    .update({ estado: "cancelada" })
    .eq("id", reservaId)
    .eq("club_id", club.id);

  revalidatePath("/dashboard/club/calendario");
}
