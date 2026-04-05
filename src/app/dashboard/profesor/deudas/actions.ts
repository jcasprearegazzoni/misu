"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDebtChargeSchema } from "@/lib/validation/debt-charge.schema";

export type DebtChargeActionState = {
  error: string | null;
  success: string | null;
};

export async function createDebtChargeAction(
  _prevState: DebtChargeActionState,
  formData: FormData,
): Promise<DebtChargeActionState> {
  const parsed = createDebtChargeSchema.safeParse({
    booking_id: formData.get("booking_id"),
    alumno_id: formData.get("alumno_id"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para registrar el cobro.",
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

  // Solo el profesor autenticado puede cobrar desde deudas.
  if (!profile || profile.role !== "profesor") {
    return {
      error: "Solo los profesores pueden registrar cobros desde deudas.",
      success: null,
    };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, profesor_id, alumno_id, status, package_consumed")
    .eq("id", parsed.data.booking_id)
    .eq("profesor_id", user.id)
    .single();

  // El booking debe pertenecer al profesor y seguir confirmado.
  if (!booking || booking.status !== "confirmado") {
    return {
      error: "El booking ya no esta disponible para cobro.",
      success: null,
    };
  }

  // El alumno del formulario debe coincidir con el booking real.
  if (booking.alumno_id !== parsed.data.alumno_id) {
    return {
      error: "El alumno no coincide con el booking seleccionado.",
      success: null,
    };
  }

  // Si consumio paquete, no corresponde cobro directo de deuda.
  if (booking.package_consumed) {
    return {
      error: "Este booking ya esta cubierto por paquete.",
      success: null,
    };
  }

  const { data: existingCoverage } = await supabase
    .from("payments")
    .select("id")
    .eq("profesor_id", user.id)
    .eq("booking_id", parsed.data.booking_id)
    .in("type", ["clase", "seña", "diferencia_cobro"])
    .limit(1);

  if ((existingCoverage ?? []).length > 0) {
    return {
      error: "Este booking ya tiene un cobro asociado.",
      success: null,
    };
  }

  const { error } = await supabase.from("payments").insert({
    profesor_id: user.id,
    alumno_id: parsed.data.alumno_id,
    booking_id: parsed.data.booking_id,
    amount: parsed.data.amount,
    method: parsed.data.method,
    type: "clase",
    note: parsed.data.note ?? null,
  });

  if (error) {
    // Si hubo carrera de doble click, el indice unico parcial evita duplicado.
    if (error.message.includes("payments_unique_booking_coverage_idx")) {
      return {
        error: "Este booking ya fue cobrado por otra accion reciente.",
        success: null,
      };
    }

    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/dashboard/profesor/finanzas");
  revalidatePath("/dashboard/profesor/calendario");

  return {
    error: null,
    success: "Cobro registrado.",
  };
}

export async function createDebtChargeQuickAction(formData: FormData) {
  await createDebtChargeAction(
    {
      error: null,
      success: null,
    },
    formData,
  );
}
