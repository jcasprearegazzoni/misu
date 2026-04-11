"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { availabilitySchema, blockedDateSchema } from "@/lib/validation/disponibilidad.schema";

export type DisponibilidadActionState = {
  error: string | null;
  success: string | null;
};

function revalidateDisponibilidadPages() {
  revalidatePath("/dashboard/profesor/clases/disponibilidad");
}

async function getProfesorIdOrRedirect() {
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
    redirect("/dashboard/alumno");
  }

  return { supabase, profesorId: user.id };
}

export async function saveAvailabilityAction(
  _prevState: DisponibilidadActionState,
  formData: FormData,
): Promise<DisponibilidadActionState> {
  const parsed = availabilitySchema.safeParse({
    id: formData.get("id"),
    day_of_week: formData.get("day_of_week"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    slot_duration_minutes: formData.get("slot_duration_minutes"),
    club_id: formData.get("club_id"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para disponibilidad.",
      success: null,
    };
  }

  const { supabase, profesorId } = await getProfesorIdOrRedirect();
  const payload = {
    profesor_id: profesorId,
    day_of_week: parsed.data.day_of_week,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
    slot_duration_minutes: parsed.data.slot_duration_minutes,
    club_id: parsed.data.club_id,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("availability")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("profesor_id", profesorId);

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }

    revalidateDisponibilidadPages();

    return {
      error: null,
      success: "Disponibilidad actualizada correctamente.",
    };
  }

  const { error } = await supabase.from("availability").insert(payload);

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  revalidateDisponibilidadPages();

  return {
    error: null,
    success: "Disponibilidad creada correctamente.",
  };
}

export async function addBlockedDateAction(
  _prevState: DisponibilidadActionState,
  formData: FormData,
): Promise<DisponibilidadActionState> {
  const parsed = blockedDateSchema.safeParse({
    start_at: formData.get("start_at"),
    end_at: formData.get("end_at"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para fecha bloqueada.",
      success: null,
    };
  }

  const { supabase, profesorId } = await getProfesorIdOrRedirect();

  const blockedStartAt = new Date(parsed.data.start_at);
  const blockedEndAt = new Date(parsed.data.end_at);

  const { error } = await supabase.from("blocked_dates").insert({
    profesor_id: profesorId,
    start_at: blockedStartAt.toISOString(),
    end_at: blockedEndAt.toISOString(),
    reason: parsed.data.reason ?? null,
  });

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  // Cancelar reservas que solapan con el bloqueo en una transacción atómica.
  // La RPC maneja la restauración de créditos de paquetes y las notificaciones.
  const { error: rpcError } = await supabase.rpc("cancel_bookings_for_blocked_range", {
    p_profesor_id: profesorId,
    p_start_at: blockedStartAt.toISOString(),
    p_end_at: blockedEndAt.toISOString(),
  });

  if (rpcError) {
    return {
      error: "Fecha bloqueada guardada, pero no se pudieron cancelar las clases solapadas.",
      success: null,
    };
  }

  revalidateDisponibilidadPages();

  return {
    error: null,
    success: "Fecha bloqueada agregada correctamente.",
  };
}

export async function saveBlockedDateAction(
  _prevState: DisponibilidadActionState,
  formData: FormData,
): Promise<DisponibilidadActionState> {
  const parsed = blockedDateSchema.safeParse({
    id: formData.get("id"),
    start_at: formData.get("start_at"),
    end_at: formData.get("end_at"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para fecha bloqueada.",
      success: null,
    };
  }

  const { supabase, profesorId } = await getProfesorIdOrRedirect();
  const blockedStartAt = new Date(parsed.data.start_at);
  const blockedEndAt = new Date(parsed.data.end_at);

  if (parsed.data.id) {
    const { error } = await supabase
      .from("blocked_dates")
      .update({
        start_at: blockedStartAt.toISOString(),
        end_at: blockedEndAt.toISOString(),
        reason: parsed.data.reason ?? null,
      })
      .eq("id", parsed.data.id)
      .eq("profesor_id", profesorId);

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }

    const { error: rpcError } = await supabase.rpc("cancel_bookings_for_blocked_range", {
      p_profesor_id: profesorId,
      p_start_at: blockedStartAt.toISOString(),
      p_end_at: blockedEndAt.toISOString(),
    });

    if (rpcError) {
      return {
        error: "Ausencia actualizada, pero no se pudieron cancelar las clases solapadas.",
        success: null,
      };
    }

    revalidateDisponibilidadPages();

    return {
      error: null,
      success: "Ausencia actualizada correctamente.",
    };
  }

  return addBlockedDateAction(_prevState, formData);
}

export async function deleteAvailabilityAction(formData: FormData): Promise<void> {
  const rawId = formData.get("id");
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const { supabase, profesorId } = await getProfesorIdOrRedirect();

  await supabase.from("availability").delete().eq("id", id).eq("profesor_id", profesorId);
  revalidateDisponibilidadPages();
}

export async function deleteBlockedDateAction(formData: FormData): Promise<void> {
  const rawId = formData.get("id");
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const { supabase, profesorId } = await getProfesorIdOrRedirect();

  await supabase.from("blocked_dates").delete().eq("id", id).eq("profesor_id", profesorId);
  revalidateDisponibilidadPages();
}
