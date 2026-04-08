"use server";

import { redirect } from "next/navigation";
import { reservaCanchaSchema } from "@/lib/validation/reserva-cancha.schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAlquilerConfirmacionEmail } from "@/lib/email/send-alquiler-confirmacion";

export type ReservarCanchaActionState = {
  error: string | null;
  success: string | null;
  reservaId: number | null;
};

function addMinutes(timeValue: string, minutesToAdd: number) {
  const [hours, minutes] = timeValue.slice(0, 5).split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const normalized = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

export async function reservarCanchaAction(
  _prev: ReservarCanchaActionState,
  formData: FormData,
): Promise<ReservarCanchaActionState> {
  const parsed = reservaCanchaSchema.safeParse({
    club_id: formData.get("club_id"),
    cancha_id: formData.get("cancha_id"),
    deporte: formData.get("deporte"),
    fecha: formData.get("fecha"),
    hora_inicio: formData.get("hora_inicio"),
    duracion_minutos: formData.get("duracion_minutos"),
    nombre: formData.get("nombre"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos de la reserva.",
      success: null,
      reservaId: null,
    };
  }

  // Cliente de sesión: solo para leer datos del usuario y validaciones públicas.
  // Las escrituras usan admin para evitar que PostgREST evalúe el USING del SELECT
  // junto con el WITH CHECK del INSERT (.insert().select()), lo que bloquea a anon/authenticated
  // que no son dueños del club (error 42501).
  const supabase = await createSupabaseServerClient();
  let supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabaseAdmin = createSupabaseAdminClient();
  } catch (adminClientError) {
    console.warn("[reservarCanchaAction] Cliente admin no disponible:", adminClientError);
    return {
      error: "No se pudo procesar la reserva en este momento.",
      success: null,
      reservaId: null,
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const horaInicioNormalizada = `${parsed.data.hora_inicio.slice(0, 5)}:00`;

  const { data: slotsData, error: slotsError } = await supabase.rpc("get_club_slots_disponibles", {
    p_club_id: parsed.data.club_id,
    p_deporte: parsed.data.deporte,
    p_fecha: parsed.data.fecha,
  });

  if (slotsError) {
    return {
      error: "No se pudo validar disponibilidad del turno.",
      success: null,
      reservaId: null,
    };
  }

  const slots = (slotsData ?? []) as Array<{
    cancha_id: number;
    hora_inicio: string;
    duracion_minutos: number;
  }>;

  const slotMatch = slots.find(
    (slot) =>
      slot.cancha_id === parsed.data.cancha_id &&
      String(slot.hora_inicio).slice(0, 8) === horaInicioNormalizada &&
      Number(slot.duracion_minutos) === parsed.data.duracion_minutos,
  );

  if (!slotMatch) {
    return {
      error: "Ese turno ya no esta disponible. Proba con otro horario.",
      success: null,
      reservaId: null,
    };
  }

  const { data: configData } = await supabase
    .from("club_configuracion")
    .select("confirmacion_automatica")
    .eq("club_id", parsed.data.club_id)
    .maybeSingle();

  const confirmacionAutomatica = configData?.confirmacion_automatica ?? true;
  const estado = confirmacionAutomatica ? "confirmada" : "pendiente";
  const horaFin = addMinutes(parsed.data.hora_inicio, parsed.data.duracion_minutos);

  const { data: reservaData, error: reservaError } = await supabaseAdmin
    .from("reservas_cancha")
    .insert({
      club_id: parsed.data.club_id,
      cancha_id: parsed.data.cancha_id,
      deporte: parsed.data.deporte,
      fecha: parsed.data.fecha,
      hora_inicio: horaInicioNormalizada,
      duracion_minutos: parsed.data.duracion_minutos,
      estado,
      tipo: "alquiler",
      confirmacion_auto: confirmacionAutomatica,
    })
    .select("id")
    .single();

  if (reservaError || !reservaData) {
    console.warn("[reservarCanchaAction] Error al crear reserva:", {
      message: reservaError?.message,
      code: reservaError?.code,
      details: reservaError?.details,
      hint: reservaError?.hint,
    });
    return {
      error: "No se pudo crear la reserva en este momento.",
      success: null,
      reservaId: null,
    };
  }

  const { error: participanteError } = await supabaseAdmin.from("reserva_participantes").insert({
    reserva_id: reservaData.id,
    user_id: user?.id ?? null,
    nombre: parsed.data.nombre,
    telefono: parsed.data.telefono ?? null,
    email: parsed.data.email ?? null,
    es_organizador: true,
  });

  if (participanteError) {
    console.warn("[reservarCanchaAction] Error al crear participante:", {
      message: participanteError.message,
      code: participanteError.code,
      details: participanteError.details,
      hint: participanteError.hint,
    });
    await supabaseAdmin.from("reservas_cancha").delete().eq("id", reservaData.id);
    return {
      error: "No se pudo guardar los datos del organizador.",
      success: null,
      reservaId: null,
    };
  }

  // Enviar email de confirmación si el participante proporcionó email.
  // El fallo del email no bloquea la reserva.
  if (parsed.data.email) {
    try {
      const { data: clubData } = await supabaseAdmin
        .from("clubs")
        .select("nombre, telefono, email_contacto")
        .eq("id", parsed.data.club_id)
        .single();

      const canchaNombre = String(formData.get("cancha_nombre") ?? "").trim() || null;

      await sendAlquilerConfirmacionEmail({
        to: parsed.data.email,
        nombre: parsed.data.nombre,
        clubNombre: clubData?.nombre ?? "el club",
        canchaNombre,
        deporte: parsed.data.deporte,
        fecha: parsed.data.fecha,
        horaInicio: parsed.data.hora_inicio,
        duracionMinutos: parsed.data.duracion_minutos,
        estado,
        clubTelefono: clubData?.telefono ?? null,
        clubEmailContacto: clubData?.email_contacto ?? null,
      });
    } catch (emailErr) {
      console.warn("[reservarCanchaAction] No se pudo enviar el email de confirmación:", emailErr);
    }
  }

  return {
    error: null,
    success:
      estado === "confirmada"
        ? "Reserva confirmada correctamente."
        : "Reserva creada. Quedo pendiente de confirmacion del club.",
    reservaId: reservaData.id,
  };
}

export async function reservarCanchaFormAction(formData: FormData): Promise<void> {
  const clubUsername = String(formData.get("club_username") ?? "");
  const deporte = String(formData.get("deporte") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const horaInicio = String(formData.get("hora_inicio") ?? "");
  const duracionMinutos = String(formData.get("duracion_minutos") ?? "");
  const canchaId = String(formData.get("cancha_id") ?? "");
  const canchaNombre = String(formData.get("cancha_nombre") ?? "");

  const result = await reservarCanchaAction(
    { error: null, success: null, reservaId: null },
    formData,
  );

  const base = `/clubes/${clubUsername}`;
  const backParams = new URLSearchParams({ deporte, fecha, hora: horaInicio, duracion: duracionMinutos });
  if (canchaId) {
    backParams.set("cancha", canchaId);
  }

  if (result.reservaId) {
    const okParams = new URLSearchParams({
      reserva_ok: "1",
      deporte,
      fecha,
      hora: horaInicio,
      duracion: duracionMinutos,
    });
    if (canchaNombre) {
      okParams.set("cancha_nombre", canchaNombre);
    }
    redirect(`${base}?${okParams.toString()}`);
  }

  // Si falló, volver a la página con el error codificado
  const errorMsg = encodeURIComponent(result.error ?? "No se pudo crear la reserva.");
  redirect(`${base}?${backParams.toString()}&error=${errorMsg}`);
}
