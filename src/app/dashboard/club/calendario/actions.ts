"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/create-notification";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actualizarEstadoReservaCancha, parseReservaId } from "@/lib/club/reserva-estado";

async function notificarOrganizadorCambioEstadoReserva(params: {
  reservaId: number;
  clubId: number;
  clubNombre: string;
  estado: "confirmada" | "cancelada";
}) {
  const supabase = await createSupabaseServerClient();

  // Busca al organizador de la reserva para notificar solo a usuarios registrados.
  const { data: organizador } = await supabase
    .from("reserva_participantes")
    .select("user_id")
    .eq("reserva_id", params.reservaId)
    .eq("es_organizador", true)
    .maybeSingle();

  if (!organizador?.user_id) {
    return;
  }

  const { data: reserva } = await supabase
    .from("reservas_cancha")
    .select("fecha, hora_inicio")
    .eq("id", params.reservaId)
    .eq("club_id", params.clubId)
    .maybeSingle();

  if (!reserva) {
    return;
  }

  if (params.estado === "confirmada") {
    await createNotification({
      userId: organizador.user_id,
      type: "reserva_cancha_confirmada",
      title: "Tu reserva de cancha fue confirmada",
      message: `Tu reserva en ${params.clubNombre} el ${reserva.fecha} a las ${reserva.hora_inicio.slice(0, 5)} fue confirmada.`,
    });
    return;
  }

  await createNotification({
    userId: organizador.user_id,
    type: "reserva_cancha_cancelada",
    title: "Tu reserva de cancha fue cancelada",
    message: `Tu reserva en ${params.clubNombre} el ${reserva.fecha} a las ${reserva.hora_inicio.slice(0, 5)} fue cancelada por el club.`,
  });
}

export async function confirmarReservaAction(formData: FormData) {
  const club = await requireClub();
  const reservaId = parseReservaId(formData.get("reserva_id"));
  if (!reservaId) return;

  const supabase = await createSupabaseServerClient();
  const result = await actualizarEstadoReservaCancha({
    supabase,
    clubId: club.id,
    reservaId,
    estado: "confirmada",
  });

  if (result.ok) {
    await notificarOrganizadorCambioEstadoReserva({
      reservaId,
      clubId: club.id,
      clubNombre: club.nombre,
      estado: "confirmada",
    });
  }

  revalidatePath("/dashboard/club/calendario");
}

export async function cancelarReservaAction(formData: FormData) {
  const club = await requireClub();
  const reservaId = parseReservaId(formData.get("reserva_id"));
  if (!reservaId) return;

  const supabase = await createSupabaseServerClient();
  const result = await actualizarEstadoReservaCancha({
    supabase,
    clubId: club.id,
    reservaId,
    estado: "cancelada",
  });

  if (result.ok) {
    await notificarOrganizadorCambioEstadoReserva({
      reservaId,
      clubId: club.id,
      clubNombre: club.nombre,
      estado: "cancelada",
    });
  }

  revalidatePath("/dashboard/club/calendario");
}
