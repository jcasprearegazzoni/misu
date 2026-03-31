"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reprogramBookingSchema } from "@/lib/validation/reprogram-booking.schema";

export type ReprogramBookingActionState = {
  error: string | null;
  success: string | null;
};

export async function reprogramBookingAction(
  _prevState: ReprogramBookingActionState,
  formData: FormData,
): Promise<ReprogramBookingActionState> {
  const rawType = formData.get("new_type");
  const parsed = reprogramBookingSchema.safeParse({
    booking_id: formData.get("booking_id"),
    new_date: formData.get("new_date"),
    new_start_time: formData.get("new_start_time"),
    new_end_time: formData.get("new_end_time"),
    new_type: rawType || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para reprogramar.",
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
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "profesor") {
    return {
      error: "Solo el profesor puede reprogramar clases.",
      success: null,
    };
  }

  // Obtener alumno_id antes de reprogramar para poder notificar.
  const { data: bookingSnap } = await supabase
    .from("bookings")
    .select("alumno_id, date, start_time, end_time")
    .eq("id", parsed.data.booking_id)
    .eq("profesor_id", user.id)
    .single();

  const { error } = await supabase.rpc("reprogram_booking_with_capacity", {
    p_booking_id: parsed.data.booking_id,
    p_profesor_id: user.id,
    p_new_date: parsed.data.new_date,
    p_new_start_time: parsed.data.new_start_time,
    p_new_end_time: parsed.data.new_end_time,
    p_new_type: parsed.data.new_type ?? null,
  });

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  // Notificar al alumno que su clase fue reprogramada.
  if (bookingSnap?.alumno_id) {
    await createNotification({
      userId: bookingSnap.alumno_id,
      type: "booking_reprogrammed",
      title: "Clase reprogramada",
      message: `Tu clase del ${bookingSnap.date} de ${bookingSnap.start_time.slice(0, 5)} a ${bookingSnap.end_time.slice(0, 5)} fue reprogramada para el ${parsed.data.new_date} de ${parsed.data.new_start_time} a ${parsed.data.new_end_time}.`,
    });
  }

  revalidatePath("/dashboard/profesor/calendario");
  revalidatePath("/dashboard/profesor/reservas");
  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/profesor/deudas");
  revalidatePath("/dashboard/profesor/pagos");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath("/dashboard/alumno/turnos");

  return {
    error: null,
    success: "Clase reprogramada correctamente.",
  };
}
