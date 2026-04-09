import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MobileAgenda } from "@/components/profesor/calendar/mobile-agenda";
import { CalendarClientContainer } from "@/components/profesor/calendar/calendar-client-container";
import { BookingStatus, CalendarBookingItem } from "@/components/profesor/calendar/types";


type BookingRow = {
  id: number;
  alumno_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: BookingStatus;
  package_consumed: boolean;
  consumed_student_package_id: number | null;
};

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

type AlumnoNameRow = {
  alumno_id: string;
  alumno_name: string | null;
};

type CoveragePaymentRow = {
  booking_id: number | null;
  type: "clase" | "paquete" | "seña" | "diferencia_cobro" | "reembolso";
};

type AlumnoOptionRow = {
  user_id: string;
  name: string | null;
  branch: string | null;
  category_tenis: string | null;
  category_padel: string | null;
  has_paleta: boolean | null;
  has_raqueta: boolean | null;
};
type RelatedAlumnoOptionRow = {
  alumno_id: string;
  alumno_name: string | null;
};

type BookingDetailContextRow = {
  booking_id: number;
  alumno_id: string;
  alumno_name: string | null;
  alumno_category: string | null;
  alumno_branch: string | null;
  alumno_zone: string | null;
  alumno_has_equipment: boolean | null;
  booking_type: string;
  booking_status: string;
  package_consumed: boolean;
  consumed_student_package_id: number | null;
  payment_covered: boolean;
};

type NextBookingRow = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: BookingStatus;
};

type ProfesorAlumnoNoteRow = {
  alumno_id: string;
  note: string;
};

type AlumnoProfileFallback = {
  branch: string | null;
  category_tenis: string | null;
  category_padel: string | null;
  has_paleta: boolean;
  has_raqueta: boolean;
};

const typeLabel: Record<BookingRow["type"], string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

const statusLabel: Record<BookingStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};


function getWeekBounds(weekOffset: number) {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(local);
  monday.setDate(local.getDate() + mondayOffset);
  monday.setDate(monday.getDate() + weekOffset * 7);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    weekDates.push(`${y}-${m}-${d}`);
  }

  const start = weekDates[0];
  const nextY = nextMonday.getFullYear();
  const nextM = String(nextMonday.getMonth() + 1).padStart(2, "0");
  const nextD = String(nextMonday.getDate()).padStart(2, "0");
  const nextMondayIso = `${nextY}-${nextM}-${nextD}`;

  return { weekDates, start, nextMondayIso };
}

function getTodayDateIso() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

function formatDateIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseWeekOffset(value?: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 0;
  }
  return Math.min(104, Math.max(-104, parsed));
}

function getEstimatedAmountByType(
  bookingType: "individual" | "dobles" | "trio" | "grupal",
  priceIndividual: number | null,
  priceDobles: number | null,
  priceTrio: number | null,
  priceGrupal: number | null,
) {
  if (bookingType === "individual") {
    return Number(priceIndividual ?? 0);
  }
  if (bookingType === "dobles") {
    return Number(priceDobles ?? 0);
  }
  if (bookingType === "trio") {
    return Number(priceTrio ?? 0);
  }
  return Number(priceGrupal ?? 0);
}

function getFinancialStatusLabel(packageConsumed: boolean, hasCoveragePayment: boolean) {
  if (packageConsumed) {
    return "Cubierto por paquete" as const;
  }
  if (hasCoveragePayment) {
    return "Pagado" as const;
  }
  return "Pendiente" as const;
}

function isBookingFinalized(dateIso: string, endTime: string, status: BookingStatus) {
  if (status === "cancelado") {
    return false;
  }
  const endDateTime = new Date(`${dateIso}T${endTime.slice(0, 8)}-03:00`);
  return endDateTime.getTime() < Date.now();
}

type CalendarioPageProps = {
  searchParams?: Promise<{
    filter?: string;
    day?: string;
    weekOffset?: string;
  }>;
};

export default async function ProfesorCalendarioPage({ searchParams }: CalendarioPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const weekOffset = parseWeekOffset(resolvedSearchParams?.weekOffset);
  const todayIso = getTodayDateIso();

  const { weekDates, start, nextMondayIso } = getWeekBounds(weekOffset);
  const selectedDay = weekDates.includes(resolvedSearchParams?.day ?? "")
    ? (resolvedSearchParams?.day as string)
    : weekOffset === 0 && weekDates.includes(todayIso)
      ? todayIso
      : weekDates[0];

  const supabase = await createSupabaseServerClient();
  const [bookingsResult, alumnoNamesResult, coveragePaymentsResult, alumnosResult, relatedAlumnosResult, notesResult, availabilityResult, blockedRangesResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, alumno_id, date, start_time, end_time, type, status, package_consumed, consumed_student_package_id")
      .eq("profesor_id", profile.user_id)
      .in("status", ["pendiente", "confirmado"])
      .gte("date", start)
      .lt("date", nextMondayIso)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.rpc("get_profesor_bookings_with_alumno_name", {
      p_profesor_id: profile.user_id,
    }),
    supabase
      .from("payments")
      .select("booking_id, type")
      .eq("profesor_id", profile.user_id)
      .not("booking_id", "is", null)
      .in("type", ["clase", "seña", "diferencia_cobro"]),
    supabase
      .from("profiles")
      .select("user_id, name, branch, category_tenis, category_padel, has_paleta, has_raqueta")
      .eq("role", "alumno")
      .order("name", { ascending: true }),
    supabase.rpc("get_profesor_alumnos_for_manual_class", {
      p_profesor_id: profile.user_id,
    }),
    supabase
      .from("profesor_alumno_notes")
      .select("alumno_id, note")
      .eq("profesor_id", profile.user_id),
    supabase
      .from("availability")
      .select("day_of_week, start_time, end_time, slot_duration_minutes")
      .eq("profesor_id", profile.user_id),
    supabase.rpc("get_profesor_blocked_ranges", {
      p_profesor_id: profile.user_id,
      p_date_from: start,
      p_date_to: nextMondayIso,
    }),
  ]);

  const hasLoadError = Boolean(
    bookingsResult.error ||
      alumnoNamesResult.error ||
      coveragePaymentsResult.error ||
      alumnosResult.error ||
      relatedAlumnosResult.error ||
      notesResult.error ||
      availabilityResult.error ||
      blockedRangesResult.error,
  );
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const alumnoNameRows = (alumnoNamesResult.data ?? []) as AlumnoNameRow[];
  const coveragePayments = (coveragePaymentsResult.data ?? []) as CoveragePaymentRow[];
  const directAlumnos = ((alumnosResult.data ?? []) as AlumnoOptionRow[]).map((alumno) => ({
    user_id: alumno.user_id,
    name: alumno.name?.trim() || "Alumno",
  }));
  const relatedAlumnos = ((relatedAlumnosResult.data ?? []) as RelatedAlumnoOptionRow[]).map((alumno) => ({
    user_id: alumno.alumno_id,
    name: alumno.alumno_name?.trim() || "Alumno",
  }));
  const alumnosMap = new Map<string, { user_id: string; name: string }>();
  for (const alumno of [...relatedAlumnos, ...directAlumnos]) {
    if (!alumnosMap.has(alumno.user_id)) {
      alumnosMap.set(alumno.user_id, alumno);
    }
  }
  const alumnos = Array.from(alumnosMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
  const alumnosProfilesFallbackMap = new Map<string, AlumnoProfileFallback>();
  for (const alumno of (alumnosResult.data ?? []) as AlumnoOptionRow[]) {
    alumnosProfilesFallbackMap.set(alumno.user_id, {
      branch: alumno.branch ?? null,
      category_tenis: alumno.category_tenis ?? null,
      category_padel: alumno.category_padel ?? null,
      has_paleta: Boolean(alumno.has_paleta),
      has_raqueta: Boolean(alumno.has_raqueta),
    });
  }
  const notes = (notesResult.data ?? []) as ProfesorAlumnoNoteRow[];
  const availability = (availabilityResult.data ?? []) as AvailabilityRow[];
  const blockedRanges = (blockedRangesResult.data ?? []) as BlockedRangeRow[];

  const alumnoNameMap = new Map<string, string>();
  for (const row of alumnoNameRows) {
    if (!alumnoNameMap.has(row.alumno_id)) {
      alumnoNameMap.set(row.alumno_id, row.alumno_name?.trim() || "Alumno");
    }
  }

  const coveredBookingIds = new Set(
    coveragePayments
      .map((payment) => payment.booking_id)
      .filter((bookingId): bookingId is number => typeof bookingId === "number"),
  );
  const noteByAlumnoId = new Map<string, string>();
  for (const row of notes) {
    noteByAlumnoId.set(row.alumno_id, row.note ?? "");
  }

  const baseItems = bookings.map((booking) => ({
      id: booking.id,
      alumno_id: booking.alumno_id,
      alumno_name: alumnoNameMap.get(booking.alumno_id) ?? "Alumno",
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      type_label: typeLabel[booking.type],
      type: booking.type,
      status: booking.status,
      is_finalized: isBookingFinalized(booking.date, booking.end_time, booking.status),
      package_consumed: booking.package_consumed,
      consumed_student_package_id: booking.consumed_student_package_id,
      profesor_note: noteByAlumnoId.get(booking.alumno_id) ?? "",
      has_coverage_payment: coveredBookingIds.has(booking.id),
      financial_pending: !booking.package_consumed && !coveredBookingIds.has(booking.id),
      financial_status_label: getFinancialStatusLabel(booking.package_consumed, coveredBookingIds.has(booking.id)),
      estimated_amount: getEstimatedAmountByType(
        booking.type,
        profile.price_individual,
        profile.price_dobles,
        profile.price_trio,
        profile.price_grupal,
      ),
    }));

  const detailEntries = await Promise.all(
    baseItems.map(async (item) => {
      const { data, error } = await supabase.rpc("get_profesor_booking_detail_context", {
        p_profesor_id: profile.user_id,
        p_booking_id: item.id,
      });

      if (error) {
        return [item.id, null] as const;
      }

      const row = ((data ?? [])[0] ?? null) as BookingDetailContextRow | null;
      return [item.id, row] as const;
    }),
  );

  const detailMap = new Map<number, BookingDetailContextRow | null>(detailEntries);

  const uniqueAlumnoIds = Array.from(new Set(baseItems.map((item) => item.alumno_id)));
  const nextClassesEntries = await Promise.all(
    uniqueAlumnoIds.map(async (alumnoId) => {
      const { data, error } = await supabase.rpc("get_profesor_alumno_next_bookings", {
        p_profesor_id: profile.user_id,
        p_alumno_id: alumnoId,
        p_limit: 5,
      });

      if (error) {
        return [alumnoId, [] as NextBookingRow[]] as const;
      }

      const rows = (data ?? []) as NextBookingRow[];
      return [alumnoId, rows] as const;
    }),
  );

  const nextClassesMap = new Map<string, NextBookingRow[]>(nextClassesEntries);

  const items: CalendarBookingItem[] = baseItems.map((item) => {
    const detail = detailMap.get(item.id);
    const fallbackProfile = alumnosProfilesFallbackMap.get(item.alumno_id);
    const nextRows = (nextClassesMap.get(item.alumno_id) ?? []).filter((row) => row.id !== item.id).slice(0, 5);
    const fallbackCategory = fallbackProfile
      ? [fallbackProfile.category_tenis, fallbackProfile.category_padel].filter(Boolean).join(" · ")
      : "";

    return {
      ...item,
      alumno_name: detail?.alumno_name?.trim() || item.alumno_name,
      alumno_category: detail?.alumno_category ?? (fallbackCategory || null),
      alumno_branch: detail?.alumno_branch ?? fallbackProfile?.branch ?? null,
      alumno_zone: detail?.alumno_zone ?? null,
      alumno_has_equipment:
        detail?.alumno_has_equipment ??
        Boolean((fallbackProfile?.has_paleta ?? false) || (fallbackProfile?.has_raqueta ?? false)),
      is_finalized: item.is_finalized,
      package_consumed: detail?.package_consumed ?? item.package_consumed,
      consumed_student_package_id: detail?.consumed_student_package_id ?? item.consumed_student_package_id ?? null,
      has_coverage_payment: detail?.payment_covered ?? item.has_coverage_payment,
      financial_pending:
        !(detail?.package_consumed ?? item.package_consumed) &&
        !(detail?.payment_covered ?? item.has_coverage_payment),
      financial_status_label: getFinancialStatusLabel(
        detail?.package_consumed ?? item.package_consumed,
        detail?.payment_covered ?? item.has_coverage_payment,
      ),
      next_classes: nextRows.map((row) => ({
        id: row.id,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
        type_label: typeLabel[row.type],
        status_label: statusLabel[row.status],
      })),
    };
  });

  const days = weekDates.map((date) => ({
    date,
    items: items.filter((item) => item.date === date),
  }));

  const prevHref = `/dashboard/profesor/calendario?weekOffset=${weekOffset - 1}&day=${selectedDay}`;
  const nextHref = `/dashboard/profesor/calendario?weekOffset=${weekOffset + 1}&day=${selectedDay}`;
  const dayLinks = weekDates.map((date) => ({
    date,
    href: `/dashboard/profesor/calendario?weekOffset=${weekOffset}&day=${date}`,
  }));
  const selectedDateObject = new Date(`${selectedDay}T00:00:00-03:00`);
  const prevDateObject = new Date(selectedDateObject);
  prevDateObject.setDate(selectedDateObject.getDate() - 1);
  const nextDateObject = new Date(selectedDateObject);
  nextDateObject.setDate(selectedDateObject.getDate() + 1);
  const prevDayIso = formatDateIso(prevDateObject);
  const nextDayIso = formatDateIso(nextDateObject);
  const prevDayWeekOffset = weekDates.includes(prevDayIso) ? weekOffset : weekOffset - 1;
  const nextDayWeekOffset = weekDates.includes(nextDayIso) ? weekOffset : weekOffset + 1;
  const prevDayHref = `/dashboard/profesor/calendario?weekOffset=${prevDayWeekOffset}&day=${prevDayIso}`;
  const nextDayHref = `/dashboard/profesor/calendario?weekOffset=${nextDayWeekOffset}&day=${nextDayIso}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>Calendario de clases</h1>

      {hasLoadError ? (
        <p className="alert-error mt-6">
          No se pudieron cargar las clases de la semana.
        </p>
      ) : (
        <>
          <CalendarClientContainer
            alumnos={alumnos}
            profesorSport={profile.sport ?? null}
            availabilityRanges={availability}
            days={days}
            blockedRanges={blockedRanges}
            selectedDay={selectedDay}
            dayLinks={dayLinks}
            prevHref={prevHref}
            nextHref={nextHref}
          />
          <MobileAgenda
            days={days}
            selectedDay={selectedDay}
            availabilityRanges={availability}
            dayLinks={dayLinks}
            prevDayHref={prevDayHref}
            nextDayHref={nextDayHref}
          />
        </>
      )}
    </main>
  );
}




