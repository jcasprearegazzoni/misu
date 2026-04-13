"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getEstimatedAmountByType(
  bookingType: "individual" | "dobles" | "trio" | "grupal",
  prices: {
    price_individual: number | null;
    price_dobles: number | null;
    price_trio: number | null;
    price_grupal: number | null;
  },
) {
  if (bookingType === "individual") {
    return Number(prices.price_individual ?? 0);
  }
  if (bookingType === "dobles") {
    return Number(prices.price_dobles ?? 0);
  }
  if (bookingType === "trio") {
    return Number(prices.price_trio ?? 0);
  }
  return Number(prices.price_grupal ?? 0);
}

export async function cancelAlumnoBookingAction(formData: FormData): Promise<void> {
  const bookingIdRaw = formData.get("booking_id");
  const bookingId = Number(bookingIdRaw);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "alumno") {
    return;
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, profesor_id, alumno_id, date, start_time, end_time, status, type, package_consumed, consumed_student_package_id, student_program_id")
    .eq("id", bookingId)
    .eq("alumno_id", user.id)
    .single();

  if (!booking) {
    return;
  }

  if (booking.status !== "pendiente" && booking.status !== "confirmado") {
    return;
  }

  const { data: profesor } = await supabase
    .from("profiles")
    .select("name, cancel_without_charge_hours, price_individual, price_dobles, price_trio, price_grupal")
    .eq("user_id", booking.profesor_id)
    .single();

  const cancellationWindowHours = Number(profesor?.cancel_without_charge_hours ?? 0);
  const bookingStart = new Date(`${booking.date}T${booking.start_time.slice(0, 8)}-03:00`);
  const now = new Date();
  const minCancelDate = new Date(bookingStart.getTime() - cancellationWindowHours * 60 * 60 * 1000);
  const isLateCancellation = cancellationWindowHours > 0 && now > minCancelDate;

  // Usa admin client para la cancelación y operaciones posteriores:
  // - El alumno necesita política UPDATE en bookings (migración 037).
  // - Para student_packages y limpieza de package_consumed, el alumno no tiene UPDATE.
  const admin = createSupabaseAdminClient();

  const { data: updatedBooking, error: cancelError } = await admin
    .from("bookings")
    .update({ status: "cancelado" })
    .eq("id", booking.id)
    .eq("alumno_id", user.id)
    .in("status", ["pendiente", "confirmado"])
    .select("id")
    .single();

  if (cancelError || !updatedBooking) {
    return;
  }

  // Si la clase había consumido un crédito de paquete, restaurarlo.
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

  if (isLateCancellation && booking.status === "confirmado" && !booking.package_consumed) {
    const { data: paymentCoverage } = await supabase
      .from("payments")
      .select("id")
      .eq("profesor_id", booking.profesor_id)
      .eq("booking_id", booking.id)
      .in("type", ["clase", "seña", "diferencia_cobro"])
      .maybeSingle();

    if (!paymentCoverage) {
      const amount = getEstimatedAmountByType(booking.type, {
        price_individual: profesor?.price_individual ?? null,
        price_dobles: profesor?.price_dobles ?? null,
        price_trio: profesor?.price_trio ?? null,
        price_grupal: profesor?.price_grupal ?? null,
      });

      if (amount > 0) {
        await supabase.from("payments").insert({
          profesor_id: booking.profesor_id,
          alumno_id: booking.alumno_id,
          booking_id: booking.id,
          amount,
          method: "transferencia_directa",
          type: "clase",
          note: "Cobro automatico por cancelacion fuera del plazo permitido.",
        });
      }
    }
  }

  await createNotification({
    userId: booking.profesor_id,
    type: "booking_cancelled",
    title: "Clase cancelada por alumno",
    message: `${profile.name || "Un alumno"} cancelo la clase del ${booking.date} de ${booking.start_time.slice(0, 5)} a ${booking.end_time.slice(0, 5)}.`,
  });

  if (isLateCancellation) {
    await createNotification({
      userId: booking.alumno_id,
      type: "booking_cancelled",
      title: "Cancelacion fuera de plazo",
      message:
        "Tu clase fue cancelada fuera del plazo permitido por el profesor. Se registro cobro automatico cuando correspondio.",
    });
  }

  revalidatePath("/dashboard/alumno/turnos");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath(`/alumno/profesores/${booking.profesor_id}/slots`);
  const { data: profesorPublic } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", booking.profesor_id)
    .maybeSingle();
  if (profesorPublic?.username) {
    revalidatePath(`/p/${profesorPublic.username}`);
  }
  revalidatePath("/dashboard/profesor/calendario");
  revalidatePath("/dashboard/profesor/finanzas");
  revalidatePath("/dashboard/profesor/pagos");
  revalidatePath("/dashboard/notificaciones");
}
