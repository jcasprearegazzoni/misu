"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bookingStatusUpdateSchema } from "@/lib/validation/booking-status.schema";
import { createSoloDecisionSchema } from "@/lib/validation/solo-decision.schema";

async function updateBookingStatus(formData: FormData, status: "confirmado" | "cancelado") {
  const parsed = bookingStatusUpdateSchema.safeParse({
    bookingId: formData.get("booking_id"),
    status,
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

  const { data: bookingContext } = await supabase
    .from("bookings")
    .select("profesor_id, alumno_id, date, start_time, end_time")
    .eq("id", parsed.data.bookingId)
    .eq("profesor_id", user.id)
    .single();

  // Actualiza solo el campo status.
  await supabase
    .from("bookings")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.bookingId)
    .eq("profesor_id", user.id);

  if (status === "confirmado") {
    // Descuenta 1 credito si el alumno tiene paquete activo y pagado.
    await supabase.rpc("consume_student_package_credit_on_booking_confirm", {
      p_booking_id: parsed.data.bookingId,
      p_profesor_id: user.id,
    });
  }

  if (bookingContext) {
    await createNotification({
      userId: bookingContext.alumno_id,
      type: status === "confirmado" ? "booking_confirmed" : "booking_cancelled",
      title: status === "confirmado" ? "Reserva confirmada" : "Reserva cancelada",
      message:
        status === "confirmado"
          ? `Tu reserva del ${bookingContext.date} de ${bookingContext.start_time.slice(0, 5)} a ${bookingContext.end_time.slice(0, 5)} fue confirmada.`
          : `Tu reserva del ${bookingContext.date} de ${bookingContext.start_time.slice(0, 5)} a ${bookingContext.end_time.slice(0, 5)} fue cancelada.`,
    });
  }

  if (status === "cancelado" && bookingContext) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.rpc("try_create_solo_decision_for_slot", {
        p_profesor_id: bookingContext.profesor_id,
        p_date: bookingContext.date,
        p_start_time: bookingContext.start_time,
        p_end_time: bookingContext.end_time,
      });
    } catch {
      // En local sin service role, no bloquea la cancelacion.
    }
  }

  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/profesor/reservas");
  revalidatePath("/dashboard/profesor/calendario");
  revalidatePath("/dashboard/profesor/slots");
  revalidatePath("/dashboard/alumno/bookings");
}

export async function confirmBookingAction(formData: FormData) {
  return updateBookingStatus(formData, "confirmado");
}

export async function cancelBookingAction(formData: FormData) {
  return updateBookingStatus(formData, "cancelado");
}

export async function createSoloDecisionAction(formData: FormData) {
  const parsed = createSoloDecisionSchema.safeParse({
    bookingId: formData.get("booking_id"),
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

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, profesor_id, alumno_id, date, start_time, end_time, type, status")
    .eq("id", parsed.data.bookingId)
    .eq("profesor_id", user.id)
    .single();

  if (!booking) {
    return;
  }

  // Solo aplica a bookings activos de tipo dobles, trio o grupal.
  if (!["pendiente", "confirmado"].includes(booking.status)) {
    return;
  }

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

  // Debe quedar un solo booking activo en el slot.
  if ((count ?? 0) !== 1) {
    return;
  }

  const { data: profesorProfile } = await supabase
    .from("profiles")
    .select("solo_decision_deadline_minutes")
    .eq("user_id", user.id)
    .single();

  const deadlineMinutes = profesorProfile?.solo_decision_deadline_minutes ?? 1440;

  await supabase.from("booking_solo_decisions").insert({
    booking_id: booking.id,
    profesor_id: booking.profesor_id,
    alumno_id: booking.alumno_id,
    status: "pendiente",
    decision_deadline_at: new Date(Date.now() + deadlineMinutes * 60 * 1000).toISOString(),
  });

  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/alumno/decisiones");
}
