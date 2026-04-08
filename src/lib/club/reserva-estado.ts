export type EstadoReservaEditable = "confirmada" | "cancelada";

type SupabaseReservaUpdateResult = {
  error: { message?: string } | null;
};

type SupabaseReservaUpdater = {
  from: (table: "reservas_cancha") => unknown;
};

export function parseEstadoReservaEditable(value: unknown): EstadoReservaEditable | null {
  if (value === "confirmada" || value === "cancelada") {
    return value;
  }
  return null;
}

export function parseReservaId(value: unknown): number | null {
  const reservaId = Number(value);
  if (!Number.isInteger(reservaId) || reservaId <= 0) {
    return null;
  }
  return reservaId;
}

export async function actualizarEstadoReservaCancha(params: {
  supabase: SupabaseReservaUpdater;
  clubId: number;
  reservaId: number;
  estado: EstadoReservaEditable;
}): Promise<{ ok: true } | { ok: false; reason: "db_error" }> {
  const queryResult = (params.supabase as any)
    .from("reservas_cancha")
    .update({ estado: params.estado })
    .eq("id", params.reservaId)
    .eq("club_id", params.clubId);

  const { error } = (await queryResult) as SupabaseReservaUpdateResult;

  if (error) {
    return { ok: false, reason: "db_error" };
  }

  return { ok: true };
}
