"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
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

  // Cancelar reservas futuras que solapan con el bloqueo y notificar alumnos.
  const startDate = blockedStartAt.toISOString().slice(0, 10);
  const endDate = blockedEndAt.toISOString().slice(0, 10);

  const { data: overlappingBookings } = await supabase
    .from("bookings")
    .select("id, alumno_id, date, start_time, end_time, status, package_consumed, consumed_student_package_id")
    .eq("profesor_id", profesorId)
    .in("status", ["pendiente", "confirmado"])
    .gte("date", startDate)
    .lte("date", endDate);

  if (overlappingBookings && overlappingBookings.length > 0) {
    // Filtrar los que efectivamente solapan en tiempo (Argentina UTC-3).
    const toCancel = overlappingBookings.filter((booking) => {
      const bookingStart = new Date(`${booking.date}T${booking.start_time.slice(0, 8)}-03:00`);
      const bookingEnd = new Date(`${booking.date}T${booking.end_time.slice(0, 8)}-03:00`);
      return bookingStart < blockedEndAt && bookingEnd > blockedStartAt;
    });

    for (const booking of toCancel) {
      const { error: cancelErr } = await supabase
        .from("bookings")
        .update({ status: "cancelado" })
        .eq("id", booking.id)
        .in("status", ["pendiente", "confirmado"]);

      if (cancelErr) {
        continue;
      }

      // Restaurar crédito de paquete si correspondía.
      if (booking.package_consumed && booking.consumed_student_package_id) {
        const { data: pkg } = await supabase
          .from("student_packages")
          .select("classes_remaining")
          .eq("id", booking.consumed_student_package_id)
          .single();

        if (pkg) {
          await supabase
            .from("student_packages")
            .update({ classes_remaining: pkg.classes_remaining + 1 })
            .eq("id", booking.consumed_student_package_id);
        }

        await supabase
          .from("bookings")
          .update({ package_consumed: false, consumed_student_package_id: null })
          .eq("id", booking.id);
      }

      // Notificar al alumno.
      await createNotification({
        userId: booking.alumno_id,
        type: "booking_cancelled",
        title: "Clase cancelada por ausencia del profesor",
        message: `Tu clase del ${booking.date} de ${booking.start_time.slice(0, 5)} a ${booking.end_time.slice(0, 5)} fue cancelada porque el profesor registró una ausencia.`,
      });
    }
  }

  revalidateDisponibilidadPages();

  return {
    error: null,
    success: "Fecha bloqueada agregada correctamente.",
  };
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
