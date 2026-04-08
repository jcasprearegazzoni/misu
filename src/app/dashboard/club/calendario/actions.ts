"use server";

import { revalidatePath } from "next/cache";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actualizarEstadoReservaCancha, parseReservaId } from "@/lib/club/reserva-estado";

export async function confirmarReservaAction(formData: FormData) {
  const club = await requireClub();
  const reservaId = parseReservaId(formData.get("reserva_id"));
  if (!reservaId) return;

  const supabase = await createSupabaseServerClient();
  await actualizarEstadoReservaCancha({
    supabase,
    clubId: club.id,
    reservaId,
    estado: "confirmada",
  });

  revalidatePath("/dashboard/club/calendario");
}

export async function cancelarReservaAction(formData: FormData) {
  const club = await requireClub();
  const reservaId = parseReservaId(formData.get("reserva_id"));
  if (!reservaId) return;

  const supabase = await createSupabaseServerClient();
  await actualizarEstadoReservaCancha({
    supabase,
    clubId: club.id,
    reservaId,
    estado: "cancelada",
  });

  revalidatePath("/dashboard/club/calendario");
}
