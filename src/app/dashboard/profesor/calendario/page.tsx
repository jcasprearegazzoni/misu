import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarStatusFilter } from "@/components/profesor/calendar/calendar-status-filter";
import { WeekCalendarStrip } from "@/components/calendar/week-calendar-strip";
import { MobileAgenda } from "@/components/profesor/calendar/mobile-agenda";
import { NewManualClassPanel } from "@/components/profesor/calendar/new-manual-class-panel";
import { WeekTimeline } from "@/components/profesor/calendar/week-timeline";
import { BookingStatus, CalendarBookingItem } from "@/components/profesor/calendar/types";

type CalendarioFilter = "pendientes" | "confirmadas" | "canceladas" | "todas";

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

type AlumnoNameRow = {
  alumno_id: string;
  alumno_name: string | null;
};

type CoveragePaymentRow = {
  booking_id: number | null;
  type: "clase" | "paquete" | "seña" | "diferencia_cobro" | "reembolso";
};

type AlumnoOptionRow = {
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

const filterToStatus: Record<Exclude<CalendarioFilter, "todas">, BookingStatus> = {
  pendientes: "pendiente",
  confirmadas: "confirmado",
  canceladas: "cancelado",
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

function parseWeekOffset(value?: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 0;
  }
  return Math.min(104, Math.max(-104, parsed));
}

function isValidFilter(value?: string): value is CalendarioFilter {
  return value === "pendientes" || value === "confirmadas" || value === "canceladas" || value === "todas";
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
  const activeFilter = isValidFilter(resolvedSearchParams?.filter) ? resolvedSearchParams.filter : "pendientes";
  const weekOffset = parseWeekOffset(resolvedSearchParams?.weekOffset);

  const { weekDates, start, nextMondayIso } = getWeekBounds(weekOffset);
  const selectedDay = weekDates.includes(resolvedSearchParams?.day ?? "")
    ? (resolvedSearchParams?.day as string)
    : weekDates[0];

  const supabase = await createSupabaseServerClient();
  const [bookingsResult, alumnoNamesResult, coveragePaymentsResult, alumnosResult, notesResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, alumno_id, date, start_time, end_time, type, status, package_consumed, consumed_student_package_id")
      .eq("profesor_id", profile.user_id)
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
    supabase.rpc("get_profesor_alumnos_for_manual_class", {
      p_profesor_id: profile.user_id,
    }),
    supabase
      .from("profesor_alumno_notes")
      .select("alumno_id, note")
      .eq("profesor_id", profile.user_id),
  ]);

  const hasLoadError = Boolean(
    bookingsResult.error ||
      alumnoNamesResult.error ||
      coveragePaymentsResult.error ||
      alumnosResult.error ||
      notesResult.error,
  );
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const alumnoNameRows = (alumnoNamesResult.data ?? []) as AlumnoNameRow[];
  const coveragePayments = (coveragePaymentsResult.data ?? []) as CoveragePaymentRow[];
  const alumnos = ((alumnosResult.data ?? []) as AlumnoOptionRow[]).map((alumno) => ({
    user_id: alumno.alumno_id,
    name: alumno.alumno_name?.trim() || "Alumno",
  }));
  const notes = (notesResult.data ?? []) as ProfesorAlumnoNoteRow[];

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

  const filterCounts = {
    todas: bookings.length,
    pendientes: bookings.filter((booking) => booking.status === "pendiente").length,
    confirmadas: bookings.filter((booking) => booking.status === "confirmado").length,
    canceladas: bookings.filter((booking) => booking.status === "cancelado").length,
  };

  const baseItems = bookings
    .filter((booking) => {
      if (activeFilter === "todas") {
        return true;
      }
      return booking.status === filterToStatus[activeFilter];
    })
    .map((booking) => ({
      id: booking.id,
      alumno_id: booking.alumno_id,
      alumno_name: alumnoNameMap.get(booking.alumno_id) ?? "Alumno",
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      type_label: typeLabel[booking.type],
      status: booking.status,
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
    const nextRows = (nextClassesMap.get(item.alumno_id) ?? []).filter((row) => row.id !== item.id).slice(0, 5);

    return {
      ...item,
      alumno_name: detail?.alumno_name?.trim() || item.alumno_name,
      alumno_category: detail?.alumno_category ?? null,
      alumno_branch: detail?.alumno_branch ?? null,
      alumno_zone: detail?.alumno_zone ?? null,
      alumno_has_equipment: detail?.alumno_has_equipment ?? false,
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Calendario de clases</h1>
      <p className="mt-2 text-sm text-zinc-600">Vista operativa semanal con eje horario comun.</p>

      <CalendarStatusFilter
        value={activeFilter}
        weekOffset={weekOffset}
        selectedDay={selectedDay}
        counts={filterCounts}
      />

      <NewManualClassPanel alumnos={alumnos} />

      <WeekCalendarStrip
        weekDates={weekDates}
        selectedDay={selectedDay}
        subtitle="Semana de clases"
        prevHref={`/dashboard/profesor/calendario?filter=${activeFilter}&weekOffset=${weekOffset - 1}&day=${selectedDay}`}
        nextHref={`/dashboard/profesor/calendario?filter=${activeFilter}&weekOffset=${weekOffset + 1}&day=${selectedDay}`}
        dayHrefBuilder={(date) =>
          `/dashboard/profesor/calendario?filter=${activeFilter}&weekOffset=${weekOffset}&day=${date}`
        }
        resetHref={
          weekOffset !== 0
            ? `/dashboard/profesor/calendario?filter=${activeFilter}&weekOffset=0&day=${weekDates[0]}`
            : undefined
        }
      />

      {hasLoadError ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar las clases de la semana.
        </p>
      ) : (
        <>
          <MobileAgenda
            days={days}
            selectedDay={selectedDay}
          />
          <WeekTimeline days={days} />
        </>
      )}
    </main>
  );
}


