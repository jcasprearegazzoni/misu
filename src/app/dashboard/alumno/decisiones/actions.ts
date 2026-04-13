"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/create-notification";
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
    .select("id, profesor_id, date, start_time, end_time, type, status, package_consumed, consumed_student_package_id, student_program_id")
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

  const admin = createSupabaseAdminClient();

  if (parsed.data.action === "aceptada_individual") {
    await supabase.from("bookings").update({ type: "individual" }).eq("id", booking.id);

    const { data: alumnoProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .single();

    const alumnoNombre = alumnoProfile?.name ?? "Un alumno";

    // Notificar al profesor que el alumno acepto continuar como individual.
    await createNotification({
      userId: booking.profesor_id,
      type: "solo_decision_accepted_individual",
      title: "Un alumno acept\u00F3 continuar con clase individual",
      message: `${alumnoNombre} acept\u00F3 continuar con la clase del ${booking.date} de ${booking.start_time.slice(0, 5)} a ${booking.end_time.slice(0, 5)} como individual.`,
    });
  } else {
    await supabase.from("bookings").update({ status: "cancelado" }).eq("id", booking.id);

    // Restaurar crédito de paquete si correspondía (usa admin para saltear RLS).
    if (booking.package_consumed && booking.consumed_student_package_id) {
      const { data: pkg } = await admin
        .from("student_packages")
        .select("classes_remaining")
        .eq("id", booking.consumed_student_package_id)
        .single();

      if (pkg) {
        await admin
          .from("student_packages")
          .update({ classes_remaining: pkg.classes_remaining + 1 })
          .eq("id", booking.consumed_student_package_id);
      }

      await admin
        .from("bookings")
        .update({ package_consumed: false, consumed_student_package_id: null })
        .eq("id", booking.id);
    }

    // Si la clase pertenecía a un programa, restaurar 1 clase restante.
    if (booking.student_program_id) {
      const { data: sp } = await admin
        .from("student_programs")
        .select("classes_remaining")
        .eq("id", booking.student_program_id)
        .single();

      if (sp) {
        await admin
          .from("student_programs")
          .update({ classes_remaining: sp.classes_remaining + 1 })
          .eq("id", booking.student_program_id);
      }
    }

    // Notificar al profesor que el alumno canceló.
    await createNotification({
      userId: booking.profesor_id,
      type: "booking_cancelled",
      title: "Alumno canceló su clase",
      message: `El alumno canceló la clase del ${booking.date} de ${booking.start_time.slice(0, 5)} a ${booking.end_time.slice(0, 5)}.`,
    });

    try {
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

  revalidatePath("/dashboard/alumno/turnos");
  revalidatePath("/dashboard/alumno/decisiones");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath("/dashboard/profesor/calendario");
  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/notificaciones");
}

export async function acceptSoloDecisionAction(formData: FormData) {
  return respondSoloDecision(formData, "aceptada_individual");
}

export async function cancelSoloDecisionAction(formData: FormData) {
  return respondSoloDecision(formData, "cancelada_alumno");
}
