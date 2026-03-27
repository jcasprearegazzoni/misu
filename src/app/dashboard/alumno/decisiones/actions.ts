"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { respondSoloDecisionSchema } from "@/lib/validation/solo-decision.schema";

async function respondSoloDecision(
  formData: FormData,
  action: "aceptada_individual" | "cancelada_alumno",
) {
  const parsed = respondSoloDecisionSchema.safeParse({
    decisionId: formData.get("decision_id"),
    action,
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: decision } = await supabase
    .from("booking_solo_decisions")
    .select("id, booking_id, alumno_id, status")
    .eq("id", parsed.data.decisionId)
    .eq("alumno_id", user.id)
    .single();

  if (!decision) {
    return;
  }

  // La decision debe seguir pendiente.
  if (decision.status !== "pendiente") {
    return;
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, profesor_id, date, start_time, end_time, type, status")
    .eq("id", decision.booking_id)
    .single();

  if (!booking) {
    return;
  }

  // El booking debe seguir activo.
  if (!["pendiente", "confirmado"].includes(booking.status)) {
    return;
  }

  // El booking debe seguir siendo dobles, trio o grupal.
  if (!["dobles", "trio", "grupal"].includes(booking.type)) {
    return;
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("profesor_id", booking.profesor_id)
    .eq("date", booking.date)
    .eq("start_time", booking.start_time)
    .eq("end_time", booking.end_time)
    .in("status", ["pendiente", "confirmado"]);

  // Debe seguir siendo el unico booking activo del slot.
  if ((count ?? 0) !== 1) {
    return;
  }

  if (parsed.data.action === "aceptada_individual") {
    await supabase.from("bookings").update({ type: "individual" }).eq("id", booking.id);
  } else {
    await supabase.from("bookings").update({ status: "cancelado" }).eq("id", booking.id);
    try {
      const admin = createSupabaseAdminClient();
      await admin.rpc("try_create_solo_decision_for_slot", {
        p_profesor_id: booking.profesor_id,
        p_date: booking.date,
        p_start_time: booking.start_time,
        p_end_time: booking.end_time,
      });
    } catch {
      // En local sin service role, no bloquea la respuesta del alumno.
    }
  }

  await supabase
    .from("booking_solo_decisions")
    .update({
      status: parsed.data.action,
      responded_at: new Date().toISOString(),
    })
    .eq("id", decision.id)
    .eq("alumno_id", user.id)
    .eq("status", "pendiente");

  revalidatePath("/dashboard/alumno/decisiones");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath("/dashboard/profesor/bookings");
}

export async function acceptSoloDecisionAction(formData: FormData) {
  return respondSoloDecision(formData, "aceptada_individual");
}

export async function cancelSoloDecisionAction(formData: FormData) {
  return respondSoloDecision(formData, "cancelada_alumno");
}
