"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profesorManualBookingSchema } from "@/lib/validation/profesor-manual-booking.schema";

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type BlockedRangeRow = {
  start_at: string;
  end_at: string;
};

export type CreateManualBookingActionState = {
  error: string | null;
  success: string | null;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getDayOfWeekFromDate(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`);
  return date.getDay();
}

function normalizeTimeWithSeconds(value: string) {
  return `${value}:00`;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function slotFitsAvailability(
  availability: AvailabilityRow[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const duration = end - start;

  return availability.some((item) => {
    if (item.day_of_week !== dayOfWeek) {
      return false;
    }

    const availabilityStart = timeToMinutes(item.start_time.slice(0, 5));
    const availabilityEnd = timeToMinutes(item.end_time.slice(0, 5));

    if (start < availabilityStart || end > availabilityEnd) {
      return false;
    }

    if (duration !== item.slot_duration_minutes) {
      return false;
    }

    return (start - availabilityStart) % item.slot_duration_minutes === 0;
  });
}

export async function createManualBookingAction(
  _prevState: CreateManualBookingActionState,
  formData: FormData,
): Promise<CreateManualBookingActionState> {
  const parsed = profesorManualBookingSchema.safeParse({
    alumno_id: formData.get("alumno_id"),
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    type: formData.get("type"),
    club_id: formData.get("club_id"),
    cancha_id: formData.get("cancha_id"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para crear la clase.",
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
      error: "Solo el profesor puede crear clases manualmente.",
      success: null,
    };
  }

  const { data: selectedAlumno, error: alumnoError } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", parsed.data.alumno_id)
    .eq("role", "alumno")
    .single();

  if (alumnoError) {
    return {
      error: "No se pudo validar el alumno seleccionado.",
      success: null,
    };
  }

  if (!selectedAlumno) {
    return {
      error: "El alumno seleccionado no es valido.",
      success: null,
    };
  }

  const [availabilityResult, blockedRangesResult] = await Promise.all([
    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, slot_duration_minutes")
      .eq("profesor_id", user.id),
    supabase.rpc("get_profesor_blocked_ranges", {
      p_profesor_id: user.id,
      p_date_from: parsed.data.date,
      p_date_to: parsed.data.date,
    }),
  ]);

  if (availabilityResult.error || blockedRangesResult.error) {
    return {
      error: "No se pudo validar disponibilidad y bloqueos para el nuevo horario.",
      success: null,
    };
  }

  const availability = (availabilityResult.data ?? []) as AvailabilityRow[];
  const blockedRanges = (blockedRangesResult.data ?? []) as BlockedRangeRow[];
  const dayOfWeek = getDayOfWeekFromDate(parsed.data.date);

  if (!slotFitsAvailability(availability, dayOfWeek, parsed.data.start_time, parsed.data.end_time)) {
    return {
      error: "El horario elegido no coincide con la disponibilidad configurada.",
      success: null,
    };
  }

  const slotStart = new Date(`${parsed.data.date}T${parsed.data.start_time}:00-03:00`);
  const slotEnd = new Date(`${parsed.data.date}T${parsed.data.end_time}:00-03:00`);
  const isBlocked = blockedRanges.some((item) => {
    const blockedStart = new Date(item.start_at);
    const blockedEnd = new Date(item.end_at);
    return overlaps(slotStart, slotEnd, blockedStart, blockedEnd);
  });

  if (isBlocked) {
    return {
      error: "El horario elegido esta bloqueado por una ausencia.",
      success: null,
    };
  }

  const { data: bookingId, error: reserveError } = await supabase.rpc("reserve_booking_with_capacity", {
    p_profesor_id: user.id,
    p_alumno_id: parsed.data.alumno_id,
    p_date: parsed.data.date,
    p_start_time: normalizeTimeWithSeconds(parsed.data.start_time),
    p_end_time: normalizeTimeWithSeconds(parsed.data.end_time),
    p_type: parsed.data.type,
  });

  if (reserveError || typeof bookingId !== "number") {
    return {
      error: reserveError?.message ?? "No se pudo crear la clase en ese horario.",
      success: null,
    };
  }

  // Clase manual creada por profesor: queda confirmada desde el inicio.
  const { error: confirmError } = await supabase
    .from("bookings")
    .update({ status: "confirmado" })
    .eq("id", bookingId)
    .eq("profesor_id", user.id)
    .eq("status", "pendiente");

  if (confirmError) {
    return {
      error: "La clase se creo, pero no se pudo confirmar automaticamente.",
      success: null,
    };
  }

  // Si se indicó un club y una cancha, vincular el booking a esa cancha.
  const clubId = parsed.data.club_id ?? null;
  const canchaId = parsed.data.cancha_id ?? null;
  if (clubId && canchaId) {
    await supabase
      .from("bookings")
      .update({ club_id: clubId, cancha_id: canchaId })
      .eq("id", bookingId)
      .eq("profesor_id", user.id);
  }

  // Si hay paquete activo/pagado, consume 1 credito como en confirmacion normal.
  await supabase.rpc("consume_student_package_credit_on_booking_confirm", {
    p_booking_id: bookingId,
    p_profesor_id: user.id,
  });

  revalidatePath("/dashboard/profesor/calendario");
  revalidatePath("/dashboard/profesor/reservas");
  revalidatePath("/dashboard/profesor/bookings");
  revalidatePath("/dashboard/profesor/deudas");
  revalidatePath("/dashboard/profesor/pagos");
  revalidatePath("/dashboard/alumno/bookings");
  revalidatePath("/dashboard/alumno/turnos");

  return {
    error: null,
    success: "Clase creada y confirmada correctamente.",
  };
}
