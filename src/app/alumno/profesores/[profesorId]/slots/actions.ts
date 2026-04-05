"use server";

import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/validation/bookings.schema";

export type BookingActionState = {
  error: string | null;
  success: string | null;
};

function addWeeksToDate(dateIso: string, weekOffset: number) {
  const baseDate = new Date(`${dateIso}T12:00:00.000Z`);
  const nextDate = new Date(baseDate.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000);
  return nextDate.toISOString().slice(0, 10);
}

export async function reserveSlotAction(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = createBookingSchema.safeParse({
    profesor_id: formData.get("profesor_id"),
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    type: formData.get("type"),
    weeks_count: formData.get("weeks_count"),
    sport: formData.get("sport") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para reservar.",
      success: null,
    };
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
    return {
      error: "Solo los alumnos pueden reservar una clase.",
      success: null,
    };
  }

  const reservedDates: string[] = [];
  const failedDates: Array<{ date: string; reason: string }> = [];

  for (let weekOffset = 0; weekOffset < parsed.data.weeks_count; weekOffset += 1) {
    const targetDate = addWeeksToDate(parsed.data.date, weekOffset);
    const { data: bookingId, error } = await supabase.rpc("reserve_booking_with_capacity", {
      p_profesor_id: parsed.data.profesor_id,
      p_alumno_id: user.id,
      p_date: targetDate,
      p_start_time: parsed.data.start_time,
      p_end_time: parsed.data.end_time,
      p_type: parsed.data.type,
    });

    if (error) {
      failedDates.push({ date: targetDate, reason: error.message });
      continue;
    }

    // Si hay sport definido, actualizar el booking recien creado usando su ID.
    if (parsed.data.sport) {
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({ sport: parsed.data.sport })
          .eq("id", bookingId);
      } else {
        console.warn(`[reserveSlotAction] RPC no devolvio booking ID para ${targetDate}, sport no actualizado.`);
      }
    }

    reservedDates.push(targetDate);
  }

  if (reservedDates.length === 0) {
    return {
      error: `No se pudo reservar ninguna clase.\n${failedDates.map((item) => `${item.date}: ${item.reason}`).join("\n")}`,
      success: null,
    };
  }

  await createNotification({
    userId: parsed.data.profesor_id,
    type: "booking_created",
    title: "Nueva reserva pendiente",
    message:
      reservedDates.length === 1
        ? `${profile.name} reservo ${reservedDates[0]} de ${parsed.data.start_time.slice(0, 5)} a ${parsed.data.end_time.slice(0, 5)}.`
        : `${profile.name} reservo ${reservedDates.length} clases desde ${reservedDates[0]} de ${parsed.data.start_time.slice(0, 5)} a ${parsed.data.end_time.slice(0, 5)}.`,
  });

  const successLines = [
    `Reservas creadas: ${reservedDates.length}/${parsed.data.weeks_count}`,
    `Fechas reservadas: ${reservedDates.join(", ")}`,
  ];

  const failedLines =
    failedDates.length > 0
      ? ["Fallidas:", ...failedDates.map((item) => `${item.date}: ${item.reason}`)]
      : [];

  return {
    error: failedLines.length > 0 ? failedLines.join("\n") : null,
    success: successLines.join("\n"),
  };
}
