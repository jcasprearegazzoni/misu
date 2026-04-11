"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bookingStatusUpdateSchema } from "@/lib/validation/booking-status.schema";
import { createSoloDecisionSchema } from "@/lib/validation/solo-decision.schema";

type BookingActionState = { error: string | null };

function isMissingConfirmWithCourtRpcError(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("confirm_booking_with_court") &&
    (message.toLowerCase().includes("does not exist") || message.toLowerCase().includes("no existe"))
  );
}

// Violacion del constraint GIST de anti-solapamiento en reservas_cancha.
// Ocurre en condiciones de carrera extremas (dos slots solapados confirmados en paralelo).
function isGistConstraintViolation(code: string | undefined) {
  return code === "23P01";
}

async function updateBookingStatus(
  _prevState: BookingActionState,
  formData: FormData,
  status: "confirmado" | "cancelado",
): Promise<BookingActionState> {
  const parsed = bookingStatusUpdateSchema.safeParse({
    bookingId: formData.get("booking_id"),
    status,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { data: bookingContext } = await supabase
    .from("bookings")
    .select("profesor_id, alumno_id, date, start_time, end_time, package_consumed, consumed_student_package_id")
    .eq("id", parsed.data.bookingId)
    .eq("profesor_id", user.id)
    .single();

  if (status === "confirmado") {
    // Confirmacion atomica en DB: valida cancha disponible y sincroniza reservas_cancha.
    const { error: confirmError } = await supabase.rpc("confirm_booking_with_court", {
      p_booking_id: parsed.data.bookingId,
      p_profesor_id: user.id,
    });

    if (confirmError) {
      if (isMissingConfirmWithCourtRpcError(confirmError.message)) {
        return {
          error: "Falta aplicar migraciones de base de datos (incluyendo la 072). Avísame y te paso el comando exacto.",
        };
      }
      if (isGistConstraintViolation(confirmError.code)) {
        return { error: "No se pudo confirmar la clase por un conflicto de horario. Intentá de nuevo." };
      }
      return { error: confirmError.message || "No se pudo confirmar la clase." };
    }

    // Descuenta 1 credito si el alumno tiene paquete activo y pagado.
    const { error: packageError } = await supabase.rpc("consume_student_package_credit_on_booking_confirm", {
      p_booking_id: parsed.data.bookingId,
      p_profesor_id: user.id,
    });

    if (packageError) {
      return { error: "Clase confirmada, pero no se pudo descontar el credito del paquete." };
    }
  } else {
    let restoredPackageCredit = false;

    // Si la clase habia consumido un credito de paquete, restaurarlo antes de cancelar.
    if (bookingContext?.package_consumed && bookingContext.consumed_student_package_id) {
      const admin = createSupabaseAdminClient();

      const { data: pkg } = await admin
        .from("student_packages")
        .select("classes_remaining")
        .eq("id", bookingContext.consumed_student_package_id)
        .single();

      if (pkg) {
        const { error: restorePackageError } = await admin
          .from("student_packages")
          .update({ classes_remaining: pkg.classes_remaining + 1 })
          .eq("id", bookingContext.consumed_student_package_id);

        if (restorePackageError) {
          return { error: "No se pudo restaurar el credito del paquete." };
        }

        restoredPackageCredit = true;
      }

      const { error: clearBookingPackageError } = await admin
        .from("bookings")
        .update({ package_consumed: false, consumed_student_package_id: null })
        .eq("id", parsed.data.bookingId)
        .eq("profesor_id", user.id);

      if (clearBookingPackageError) {
        return { error: "No se pudo actualizar el consumo de paquete en la reserva." };
      }
    }

    // Para cancelacion se mantiene update directo; DB se encarga de sincronizar el espejo.
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.bookingId)
      .eq("profesor_id", user.id);

    if (updateError) {
      return { error: "No se pudo actualizar el estado de la clase." };
    }

    if (bookingContext) {
      await createNotification({
        userId: bookingContext.alumno_id,
        type: "booking_cancelled",
        title: "Reserva cancelada",
        message: `Tu reserva del ${bookingContext.date} de ${bookingContext.start_time.slice(0, 5)} a ${bookingContext.end_time.slice(0, 5)} fue cancelada.${restoredPackageCredit ? " Se devolvió 1 clase a tu paquete." : ""}`,
      });
    }
  }

  if (bookingContext && status === "confirmado") {
    await createNotification({
      userId: bookingContext.alumno_id,
      type: "booking_confirmed",
      title: "Reserva confirmada",
      message: `Tu reserva del ${bookingContext.date} de ${bookingContext.start_time.slice(0, 5)} a ${bookingContext.end_time.slice(0, 5)} fue confirmada.`,
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
  revalidatePath("/dashboard/profesor/calendario");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath("/dashboard/club/calendario");
  revalidatePath("/dashboard/club");

  return { error: null };
}

export async function confirmBookingAction(
  prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return updateBookingStatus(prevState, formData, "confirmado");
}

export async function cancelBookingAction(
  prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  return updateBookingStatus(prevState, formData, "cancelado");
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
  const decisionDeadlineAt = new Date(Date.now() + deadlineMinutes * 60 * 1000).toISOString();

  const { error: insertSoloDecisionError } = await supabase.from("booking_solo_decisions").insert({
    booking_id: booking.id,
    profesor_id: booking.profesor_id,
    alumno_id: booking.alumno_id,
    status: "pendiente",
    decision_deadline_at: decisionDeadlineAt,
  });

  if (insertSoloDecisionError) {
    return;
  }

  // Notifica al alumno solo si la decision se creo correctamente.
  await createNotification({
    userId: booking.alumno_id,
    type: "solo_decision_created",
    title: "Ten\u00E9s que tomar una decisi\u00F3n sobre tu clase",
    message: `Tu clase del ${booking.date} de ${booking.start_time.slice(0, 5)} a ${booking.end_time.slice(0, 5)} requiere decisi\u00F3n antes del ${decisionDeadlineAt}.`,
  });

  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/alumno/decisiones");
}

