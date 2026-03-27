"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPaymentSchema } from "@/lib/validation/payments.schema";

export type CreatePaymentActionState = {
  error: string | null;
  success: string | null;
};

export async function createPaymentAction(
  _prevState: CreatePaymentActionState,
  formData: FormData,
): Promise<CreatePaymentActionState> {
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
      error: "Solo los profesores pueden registrar pagos.",
      success: null,
    };
  }

  const parsed = createPaymentSchema.safeParse({
    alumno_id: formData.get("alumno_id"),
    booking_id: formData.get("booking_id"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    type: formData.get("type"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para registrar el pago.",
      success: null,
    };
  }

  // Si se informa booking, se valida pertenencia al profesor y al alumno elegido.
  if (parsed.data.booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, alumno_id")
      .eq("id", parsed.data.booking_id)
      .eq("profesor_id", user.id)
      .single();

    if (!booking) {
      return {
        error: "El booking seleccionado no pertenece a este profesor.",
        success: null,
      };
    }

    if (booking.alumno_id !== parsed.data.alumno_id) {
      return {
        error: "El alumno no coincide con el booking seleccionado.",
        success: null,
      };
    }

    // Evita cobrar dos veces la misma cobertura del booking.
    const { data: existingCoverage } = await supabase
      .from("payments")
      .select("id")
      .eq("profesor_id", user.id)
      .eq("booking_id", parsed.data.booking_id)
      .in("type", ["clase", "seña", "diferencia_cobro"])
      .limit(1);

    if ((existingCoverage ?? []).length > 0) {
      return {
        error: "Este booking ya tiene un cobro de cobertura asociado.",
        success: null,
      };
    }
  }

  const { error } = await supabase.from("payments").insert({
    profesor_id: user.id,
    alumno_id: parsed.data.alumno_id,
    booking_id: parsed.data.booking_id ?? null,
    amount: parsed.data.amount,
    method: parsed.data.method,
    type: parsed.data.type,
    note: parsed.data.note ?? null,
  });

  if (error) {
    if (error.message.includes("payments_unique_booking_coverage_idx")) {
      return {
        error: "Este booking ya tiene un cobro de cobertura asociado.",
        success: null,
      };
    }

    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/dashboard/profesor/pagos");

  return {
    error: null,
    success: "Pago registrado correctamente.",
  };
}
