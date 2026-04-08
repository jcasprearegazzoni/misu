import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentClub } from "@/lib/auth/get-current-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actualizarEstadoReservaCancha,
  parseEstadoReservaEditable,
  parseReservaId,
} from "@/lib/club/reserva-estado";

export async function POST(request: Request) {
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const reservaId = parseReservaId((payload as { reserva_id?: unknown })?.reserva_id);
  const estado = parseEstadoReservaEditable((payload as { estado?: unknown })?.estado);

  if (!reservaId || !estado) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const result = await actualizarEstadoReservaCancha({
    supabase,
    clubId: club.id,
    reservaId,
    estado,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "No se pudo actualizar la reserva." }, { status: 500 });
  }

  revalidatePath("/dashboard/club/calendario");
  return NextResponse.json({ ok: true });
}
