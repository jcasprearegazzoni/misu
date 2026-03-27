"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const parsed = reprogramBookingSchema.safeParse({
    booking_id: formData.get("booking_id"),
    new_date: formData.get("new_date"),
    new_start_time: formData.get("new_start_time"),
    new_end_time: formData.get("new_end_time"),
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

  const { error } = await supabase.rpc("reprogram_booking_with_capacity", {
    p_booking_id: parsed.data.booking_id,
    p_profesor_id: user.id,
    p_new_date: parsed.data.new_date,
    p_new_start_time: parsed.data.new_start_time,
    p_new_end_time: parsed.data.new_end_time,
  });

  if (error) {
    return {
      error: error.message,
      success: null,
    };
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
