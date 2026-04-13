import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatAmount, getMonthRange } from "@/lib/finanzas/date-helpers";
import { buildDebtSummaryByStudent, buildPendingDebtBookings } from "@/lib/finanzas/debt-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfesorMetricas } from "./metricas-tab";
import { DebtChargeForm } from "../deudas/debt-charge-form";
import { PaymentForm } from "../pagos/payment-form";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type BookingRow = {
  id: number;
  alumno_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
  package_consumed: boolean;
};

type MonthConfirmedBookingRow = {
  id: number;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
};

type PaymentRow = {
  booking_id: number | null;
  amount: number;
  method: "efectivo" | "transferencia_directa";
  type: "clase" | "paquete" | "seña" | "diferencia_cobro" | "reembolso";
  created_at: string;
};

type AlumnoNameRow = {
  alumno_id: string;
  alumno_name: string | null;
};

type FullBookingRow = {
  id: number;
  alumno_id: string;
  alumno_name: string | null;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
};

type FullPaymentRow = {
  id: number;
  alumno_id: string;
  booking_id: number | null;
  amount: number;
  method: "efectivo" | "transferencia_directa";
  type: "clase" | "paquete" | "seña" | "diferencia_cobro" | "reembolso";
  note: string | null;
  created_at: string;
};

type MetricPaymentRow = {
  alumno_id: string | null;
  amount: number;
  created_at: string;
};

type MetricBookingRow = {
  alumno_id: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  date: string;
  start_time: string;
};

// ── Labels para la UI ─────────────────────────────────────────────────────────

const methodLabel: Record<FullPaymentRow["method"], string> = {
  efectivo: "Efectivo",
  transferencia_directa: "Transferencia directa",
};

const paymentTypeLabel: Record<FullPaymentRow["type"], string> = {
  clase: "Clase",
  paquete: "Paquete",
  seña: "Seña",
  diferencia_cobro: "Diferencia de cobro",
  reembolso: "Reembolso",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sumPaymentsAmount(payments: PaymentRow[]) {
  return payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
}

function getTimeDiffHours(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (Number.isNaN(startMin) || Number.isNaN(endMin) || endMin <= startMin) return 0;
  return (endMin - startMin) / 60;
}

function getEstimatedIncomeByType(
  bookingType: BookingRow["type"],
  prices: {
    price_individual: number | null;
    price_dobles: number | null;
    price_trio: number | null;
    price_grupal: number | null;
  },
) {
  if (bookingType === "individual") return Number(prices.price_individual ?? 0);
  if (bookingType === "dobles") return Number(prices.price_dobles ?? 0);
  if (bookingType === "trio") return Number(prices.price_trio ?? 0);
  return Number(prices.price_grupal ?? 0);
}

function getEstimatedCourtCost(
  confirmedBookings: MonthConfirmedBookingRow[],
  profile: {
    court_cost_mode: "fixed_per_hour" | "per_student_percentage";
    court_cost_per_hour: number | null;
    court_percentage_per_student: number | null;
    price_individual: number | null;
    price_dobles: number | null;
    price_trio: number | null;
    price_grupal: number | null;
  },
) {
  if (profile.court_cost_mode === "per_student_percentage") {
    const pct = Number(profile.court_percentage_per_student ?? 0);
    return confirmedBookings.reduce((acc, b) => {
      const income = getEstimatedIncomeByType(b.type, profile);
      return acc + income * (pct / 100);
    }, 0);
  }
  const perHour = Number(profile.court_cost_per_hour ?? 0);
  const totalHours = confirmedBookings.reduce(
    (acc, b) => acc + getTimeDiffHours(b.start_time, b.end_time),
    0,
  );
  return totalHours * perHour;
}

/** Clave "YYYY-MM" para agrupar pagos por mes */
function getMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Etiqueta corta "oct 24" */
function buildShortMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(date)
    .replace(".", "")
    .replace(/\s+/g, " ");
}

// ── Componente de página ──────────────────────────────────────────────────────

type PageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function ProfesorFinanzasPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const tab = resolvedParams?.tab;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "profesor") redirect("/dashboard/alumno");

  const supabase = await createSupabaseServerClient();
  const currentMonth = getMonthRange(0);
  const previousMonth = getMonthRange(-1);

  // Queries base: siempre se ejecutan (necesarias para ambas pestañas)
  const [
    currentPaymentsResult,
    previousPaymentsResult,
    bookingsResult,
    coveragePaymentsResult,
    currentMonthConfirmedBookingsResult,
    previousMonthConfirmedBookingsResult,
    alumnoNamesRpcResult,
    activeProgramsCountResult,
    assignedStudentProgramsCountResult,
    paidStudentProgramsCountResult,
    studentPackagesWithCreditsCountResult,
    allPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("booking_id, amount, method, type, created_at")
      .eq("profesor_id", profile.user_id)
      .gte("created_at", currentMonth.startIso)
      .lt("created_at", currentMonth.endIso),
    supabase
      .from("payments")
      .select("booking_id, amount, method, type, created_at")
      .eq("profesor_id", profile.user_id)
      .gte("created_at", previousMonth.startIso)
      .lt("created_at", previousMonth.endIso),
    supabase
      .from("bookings")
      .select("id, alumno_id, date, start_time, end_time, type, status, package_consumed")
      .eq("profesor_id", profile.user_id)
      .eq("status", "confirmado"),
    supabase
      .from("payments")
      .select("booking_id, amount, method, type, created_at")
      .eq("profesor_id", profile.user_id)
      .not("booking_id", "is", null)
      .in("type", ["clase", "seña", "diferencia_cobro"]),
    supabase
      .from("bookings")
      .select("id, start_time, end_time, type")
      .eq("profesor_id", profile.user_id)
      .eq("status", "confirmado")
      .gte("date", currentMonth.startIso.slice(0, 10))
      .lt("date", currentMonth.endIso.slice(0, 10)),
    supabase
      .from("bookings")
      .select("id, start_time, end_time, type")
      .eq("profesor_id", profile.user_id)
      .eq("status", "confirmado")
      .gte("date", previousMonth.startIso.slice(0, 10))
      .lt("date", previousMonth.endIso.slice(0, 10)),
    supabase.rpc("get_profesor_bookings_with_alumno_name", {
      p_profesor_id: profile.user_id,
    }),
    supabase
      .from("programs")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id)
      .eq("active", true),
    supabase
      .from("student_programs")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id),
    supabase
      .from("student_programs")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id)
      .eq("paid", true),
    supabase
      .from("student_programs")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id)
      .gt("classes_remaining", 0),
    supabase
      .from("payments")
      .select("id, alumno_id, booking_id, amount, method, type, note, created_at")
      .eq("profesor_id", profile.user_id)
      .order("created_at", { ascending: false }),
  ]);

  const hasLoadError = Boolean(
    currentPaymentsResult.error ||
      previousPaymentsResult.error ||
      bookingsResult.error ||
      coveragePaymentsResult.error ||
      currentMonthConfirmedBookingsResult.error ||
      previousMonthConfirmedBookingsResult.error,
  );

  // ── Procesar datos base ───────────────────────────────────────────────────

  const currentPayments = (currentPaymentsResult.data ?? []) as PaymentRow[];
  const previousPayments = (previousPaymentsResult.data ?? []) as PaymentRow[];
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const coveragePayments = (coveragePaymentsResult.data ?? []) as PaymentRow[];
  const currentMonthConfirmedBookings =
    (currentMonthConfirmedBookingsResult.data ?? []) as MonthConfirmedBookingRow[];
  const previousMonthConfirmedBookings =
    (previousMonthConfirmedBookingsResult.data ?? []) as MonthConfirmedBookingRow[];
  const alumnoNameRows = (alumnoNamesRpcResult.data ?? []) as AlumnoNameRow[];
  const allPayments = (allPaymentsResult.data ?? []) as FullPaymentRow[];
  const allBookings = (alumnoNamesRpcResult.data ?? []) as FullBookingRow[];

  // Mapa alumno_id → nombre para reutilizar en ambas pestañas
  const alumnoNameMap = new Map<string, string>();
  for (const row of alumnoNameRows) {
    if (!alumnoNameMap.has(row.alumno_id)) {
      alumnoNameMap.set(row.alumno_id, row.alumno_name?.trim() || "Alumno");
    }
  }

  const coveredBookingIds = new Set(
    coveragePayments
      .map((p) => p.booking_id)
      .filter((id): id is number => typeof id === "number"),
  );

  // Deudas
  const pendingDebtBookings = buildPendingDebtBookings({
    bookings,
    coveredBookingIds,
    alumnoNameMap,
    priceIndividual: profile.price_individual,
    priceDobles: profile.price_dobles,
    priceTrio: profile.price_trio,
    priceGrupal: profile.price_grupal,
  });
  const debtSummary = buildDebtSummaryByStudent(pendingDebtBookings);
  const debtTotal = debtSummary.reduce((acc, item) => acc + item.estimated_total, 0);

  // Revenue
  const ingresosMesActual = sumPaymentsAmount(currentPayments);
  const ingresosMesAnterior = sumPaymentsAmount(previousPayments);
  const costoCanchaMesActual = getEstimatedCourtCost(currentMonthConfirmedBookings, profile);
  const costoCanchaMesAnterior = getEstimatedCourtCost(previousMonthConfirmedBookings, profile);
  const ingresosNetosMesActual = ingresosMesActual - costoCanchaMesActual;
  const ingresosNetosMesAnterior = ingresosMesAnterior - costoCanchaMesAnterior;

  const methodSummary = {
    efectivo: sumPaymentsAmount(currentPayments.filter((p) => p.method === "efectivo")),
    transferencia_directa: sumPaymentsAmount(
      currentPayments.filter((p) => p.method === "transferencia_directa"),
    ),
  };

  const programsResumen = {
    activePrograms: activeProgramsCountResult.count ?? 0,
    assignedStudentPrograms: assignedStudentProgramsCountResult.count ?? 0,
    paidStudentPrograms: paidStudentProgramsCountResult.count ?? 0,
    withCreditsStudentPrograms: studentPackagesWithCreditsCountResult.count ?? 0,
  };

  // Opciones para formulario de pago
  const allCoveredBookingIds = new Set(
    allPayments
      .filter(
        (p) =>
          p.booking_id !== null &&
          (p.type === "clase" || p.type === "seña" || p.type === "diferencia_cobro"),
      )
      .map((p) => p.booking_id as number),
  );

  const alumnos = Array.from(
    new Map(
      allBookings.map((b) => [
        b.alumno_id,
        { user_id: b.alumno_id, label: b.alumno_name?.trim() || "Alumno" },
      ]),
    ).values(),
  );

  const bookingOptions = allBookings
    .filter((b) => b.status !== "cancelado" && !allCoveredBookingIds.has(b.id))
    .map((b) => ({
      id: b.id,
      alumno_id: b.alumno_id,
      alumno_name: b.alumno_name?.trim() || "Alumno",
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      type: b.type,
    }));

  // ── Queries y cálculos de métricas (solo cuando tab === "metricas") ────────

  let metricsProps: React.ComponentProps<typeof ProfesorMetricas> | null = null;
  let metricsHasError = false;

  if (tab === "metricas") {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const sixMonthsAgoIsoDate = sixMonthsAgo.toISOString().slice(0, 10);
    const threeMonthsAgoIsoDate = threeMonthsAgo.toISOString().slice(0, 10);

    const [
      allTimePaymentsMetricResult,
      confirmedBookingsThisMonthResult,
      confirmedBookingsPrevMonthResult,
      heatmapBookingsResult,
    ] = await Promise.all([
      supabase
        .from("payments")
        .select("alumno_id, amount, created_at")
        .eq("profesor_id", profile.user_id)
        .gte("created_at", sixMonthsAgo.toISOString())
        .lt("created_at", currentMonth.endIso),
      supabase
        .from("bookings")
        .select("alumno_id, type, date, start_time")
        .eq("profesor_id", profile.user_id)
        .eq("status", "confirmado")
        .gte("date", currentMonth.startIso.slice(0, 10))
        .lt("date", currentMonth.endIso.slice(0, 10)),
      supabase
        .from("bookings")
        .select("alumno_id, type, date, start_time")
        .eq("profesor_id", profile.user_id)
        .eq("status", "confirmado")
        .gte("date", previousMonth.startIso.slice(0, 10))
        .lt("date", previousMonth.endIso.slice(0, 10)),
      supabase
        .from("bookings")
        .select("date, start_time")
        .eq("profesor_id", profile.user_id)
        .eq("status", "confirmado")
        .gte("date", threeMonthsAgoIsoDate)
        .lt("date", currentMonth.endIso.slice(0, 10)),
    ]);

    metricsHasError = Boolean(
      allTimePaymentsMetricResult.error ||
        confirmedBookingsThisMonthResult.error ||
        confirmedBookingsPrevMonthResult.error ||
        heatmapBookingsResult.error,
    );

    if (!metricsHasError) {
      const allTimePayments = (allTimePaymentsMetricResult.data ?? []) as MetricPaymentRow[];
      const confirmedBookingsThisMonth =
        (confirmedBookingsThisMonthResult.data ?? []) as MetricBookingRow[];
      const confirmedBookingsPrevMonth =
        (confirmedBookingsPrevMonthResult.data ?? []) as MetricBookingRow[];
      const heatmapBookings = (heatmapBookingsResult.data ?? []) as Array<{
        date: string;
        start_time: string;
      }>;

      // Retención
      const alumnosEsteMes = new Set(confirmedBookingsThisMonth.map((b) => b.alumno_id));
      const alumnosMesAnterior = new Set(confirmedBookingsPrevMonth.map((b) => b.alumno_id));
      const retenidos = Array.from(alumnosEsteMes).filter((id) => alumnosMesAnterior.has(id)).length;
      const tasaRetencion =
        alumnosMesAnterior.size > 0 ? Math.round((retenidos / alumnosMesAnterior.size) * 100) : 0;
      const alumnosNuevos = Array.from(alumnosEsteMes).filter(
        (id) => !alumnosMesAnterior.has(id),
      ).length;

      // Ticket promedio del mes actual
      const currentMonthKey = getMonthKey(new Date(currentMonth.startIso));
      const pagosMesActual = allTimePayments.filter(
        (p) => getMonthKey(new Date(p.created_at)) === currentMonthKey,
      );
      const revenueEsteMes = pagosMesActual.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      const alumnosConPago = new Set(
        pagosMesActual.map((p) => p.alumno_id).filter((id): id is string => Boolean(id)),
      );
      const ticketPromedio =
        alumnosConPago.size > 0 ? Math.round(revenueEsteMes / alumnosConPago.size) : 0;

      // Revenue últimos 6 meses
      const monthBuckets = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(
          Date.UTC(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1),
        );
        return { key: getMonthKey(d), mes: buildShortMonthLabel(d) };
      });
      const revenueByMonth = new Map<string, number>();
      for (const p of allTimePayments) {
        if (new Date(p.created_at).toISOString().slice(0, 10) < sixMonthsAgoIsoDate) continue;
        const k = getMonthKey(new Date(p.created_at));
        revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + Number(p.amount ?? 0));
      }
      const revenueUltimos6Meses = monthBuckets.map((b) => ({
        mes: b.mes,
        total: Math.round(revenueByMonth.get(b.key) ?? 0),
      }));

      // Distribución por tipo
      const clasesPorTipo = { individual: 0, dobles: 0, trio: 0, grupal: 0 };
      for (const b of confirmedBookingsThisMonth) {
        clasesPorTipo[b.type] += 1;
      }

      // Top 5 alumnos por revenue total (6 meses)
      const alumnoTotals = new Map<string, { total: number; pagos: number }>();
      for (const p of allTimePayments) {
        if (!p.alumno_id) continue;
        const current = alumnoTotals.get(p.alumno_id) ?? { total: 0, pagos: 0 };
        current.total += Number(p.amount ?? 0);
        current.pagos += 1;
        alumnoTotals.set(p.alumno_id, current);
      }
      const topAlumnos = Array.from(alumnoTotals.entries())
        .map(([alumnoId, values]) => ({
          alumno_id: alumnoId,
          nombre: alumnoNameMap.get(alumnoId) ?? "Alumno",
          total: Math.round(values.total),
          pagos: values.pagos,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Heatmap: distribución de clases por día/hora (últimos 3 meses)
      const heatmap: Record<number, Record<number, number>> = {};
      for (const b of heatmapBookings) {
        const dayOfWeek = new Date(`${b.date}T12:00:00Z`).getUTCDay();
        const hour = Number.parseInt(b.start_time.split(":")[0] ?? "", 10);
        if (Number.isNaN(hour) || hour < 6 || hour > 22) continue;
        heatmap[dayOfWeek] ??= {};
        heatmap[dayOfWeek][hour] = (heatmap[dayOfWeek][hour] ?? 0) + 1;
      }

      metricsProps = {
        clasesEsteMes: confirmedBookingsThisMonth.length,
        alumnosActivosEsteMes: alumnosEsteMes.size,
        alumnosActivosMesAnterior: alumnosMesAnterior.size,
        ticketPromedio,
        tasaRetencion,
        alumnosNuevos,
        revenueUltimos6Meses,
        clasesPorTipo,
        topAlumnos,
        heatmap,
      };
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Finanzas
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Controlá ingresos, deudas y estado de cobros en una sola vista.
        </p>
      </header>

      {/* Navegación de pestañas */}
      <nav className="mt-4 flex border-b" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/dashboard/profesor/finanzas"
          className="px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            borderBottom: tab !== "metricas" ? "2px solid var(--misu)" : "2px solid transparent",
            color: tab !== "metricas" ? "var(--foreground)" : "var(--muted)",
          }}
        >
          Resumen
        </Link>
        <Link
          href="/dashboard/profesor/finanzas?tab=metricas"
          className="px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            borderBottom: tab === "metricas" ? "2px solid var(--misu)" : "2px solid transparent",
            color: tab === "metricas" ? "var(--foreground)" : "var(--muted)",
          }}
        >
          Métricas
        </Link>
      </nav>

      {/* ── TAB: MÉTRICAS ─────────────────────────────────────────────────── */}
      {tab === "metricas" ? (
        <>
          {(hasLoadError || metricsHasError) && (
            <div className="alert-error mt-6">
              No se pudieron cargar los datos. Intentá nuevamente.
            </div>
          )}
          {metricsProps && <ProfesorMetricas {...metricsProps} />}
        </>
      ) : (
        <>
          {/* ── TAB: RESUMEN ──────────────────────────────────────────────── */}
          {hasLoadError && (
            <div className="alert-error mt-6">
              No se pudieron cargar los datos financieros. Intentá nuevamente.
            </div>
          )}

          {/* Cards KPI */}
          <section className="mt-6">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Resumen rápido
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="card px-4 py-4">
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  Ingresos brutos (mes actual)
                </p>
                <p
                  className="mt-2 text-2xl font-black leading-none"
                  style={{ color: "var(--foreground)" }}
                >
                  {formatAmount(ingresosMesActual)}
                </p>
              </article>

              <article className="card px-4 py-4">
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  Costo de cancha estimado
                </p>
                <p
                  className="mt-2 text-2xl font-black leading-none"
                  style={{ color: "var(--muted)" }}
                >
                  {formatAmount(costoCanchaMesActual)}
                </p>
              </article>

              <article
                className="card px-4 py-4"
                style={{ borderColor: "var(--border-misu)" }}
              >
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  Ingreso neto (mes actual)
                </p>
                <p
                  className="mt-2 text-2xl font-black leading-none"
                  style={{
                    color: ingresosNetosMesActual < 0 ? "var(--error)" : "var(--success)",
                  }}
                >
                  {formatAmount(ingresosNetosMesActual)}
                </p>
              </article>

              <article className="card px-4 py-4">
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  Deuda pendiente estimada
                </p>
                <p
                  className="mt-2 text-2xl font-black leading-none"
                  style={{ color: "var(--warning)" }}
                >
                  {formatAmount(debtTotal)}
                </p>
              </article>
            </div>
          </section>

          {/* Comparativa mes actual vs anterior */}
          <section className="mt-6 grid gap-3 md:grid-cols-2">
            <article className="card p-4">
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Mes actual
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Bruto
                  </p>
                  <p className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                    {formatAmount(ingresosMesActual)}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Neto
                  </p>
                  <p
                    className="text-xl font-black"
                    style={{
                      color: ingresosNetosMesActual < 0 ? "var(--error)" : "var(--success)",
                    }}
                  >
                    {formatAmount(ingresosNetosMesActual)}
                  </p>
                </div>
              </div>
            </article>

            <article className="card p-4">
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Mes anterior
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Bruto
                  </p>
                  <p className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                    {formatAmount(ingresosMesAnterior)}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Neto
                  </p>
                  <p
                    className="text-xl font-black"
                    style={{
                      color: ingresosNetosMesAnterior < 0 ? "var(--error)" : "var(--success)",
                    }}
                  >
                    {formatAmount(ingresosNetosMesAnterior)}
                  </p>
                </div>
              </div>
            </article>
          </section>

          {/* Métodos de pago y deudores */}
          <section className="mt-6 grid gap-3 lg:grid-cols-2">
            <article className="card overflow-hidden">
              <div className="px-4 py-3">
                <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  Métodos de pago (mes actual)
                </h2>
              </div>
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Monto total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Efectivo</td>
                    <td className="font-semibold">{formatAmount(methodSummary.efectivo)}</td>
                  </tr>
                  <tr>
                    <td>Transferencia directa</td>
                    <td className="font-semibold">
                      {formatAmount(methodSummary.transferencia_directa)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="card overflow-hidden">
              <div className="px-4 py-3">
                <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  Deudores
                </h2>
              </div>
              {debtSummary.length === 0 ? (
                <div className="px-4 pb-4 text-sm" style={{ color: "var(--muted)" }}>
                  No hay deudas pendientes.
                </div>
              ) : (
                <table className="table-dark">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Clases</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtSummary.map((item) => (
                      <tr key={item.alumno_id}>
                        <td className="font-medium">{item.alumno_name}</td>
                        <td>{item.bookings_count}</td>
                        <td className="font-semibold" style={{ color: "var(--warning)" }}>
                          {formatAmount(item.estimated_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>
          </section>

          {/* Programas */}
          <section className="mt-6">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Programas
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Activos", value: programsResumen.activePrograms },
                { label: "Asignados", value: programsResumen.assignedStudentPrograms },
                { label: "Pagados", value: programsResumen.paidStudentPrograms },
                { label: "Con créditos", value: programsResumen.withCreditsStudentPrograms },
              ].map((item) => (
                <article key={item.label} className="card px-4 py-4">
                  <p
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="mt-2 text-2xl font-black leading-none"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Detalle de deudas ─────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Detalle de deudas pendientes
            </h2>

            <div className="mt-3">
              <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
                Resumen por alumno
              </h3>
              {debtSummary.length === 0 ? (
                <p className="card px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                  No hay saldo pendiente.
                </p>
              ) : (
                <div className="card overflow-hidden">
                  <table className="table-dark">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Clases pendientes</th>
                        <th>Monto estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtSummary.map((item) => (
                        <tr key={item.alumno_id}>
                          <td className="font-medium">{item.alumno_name}</td>
                          <td>{item.bookings_count}</td>
                          <td className="font-semibold" style={{ color: "var(--warning)" }}>
                            {formatAmount(item.estimated_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
                Detalle por clase
              </h3>
              {pendingDebtBookings.length === 0 ? (
                <p className="card px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                  No hay clases pendientes de cobro.
                </p>
              ) : (
                <div className="card overflow-x-auto">
                  <table className="table-dark">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Alumno</th>
                        <th>Tipo</th>
                        <th>Paquete</th>
                        <th>Estado</th>
                        <th>Monto</th>
                        <th>Cobrar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDebtBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{formatUserDate(booking.date)}</td>
                          <td>
                            {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                          </td>
                          <td>{booking.alumno_name}</td>
                          <td>{booking.type}</td>
                          <td>{booking.package_consumed ? "Sí" : "No"}</td>
                          <td>{booking.financial_status}</td>
                          <td style={{ color: "var(--warning)" }}>
                            {formatAmount(booking.estimated_amount)}
                          </td>
                          <td>
                            <DebtChargeForm
                              bookingId={booking.id}
                              alumnoId={booking.alumno_id}
                              estimatedAmount={booking.estimated_amount}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ── Registrar cobro ───────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Registrar cobro
            </h2>
            {alumnos.length === 0 ? (
              <p className="card mt-3 px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                No hay clases confirmadas de alumnos. Confirmá una reserva primero.
              </p>
            ) : (
              <div className="card mt-3 p-4">
                <PaymentForm
                  alumnos={alumnos}
                  bookings={bookingOptions}
                  priceIndividual={profile.price_individual}
                  priceDobles={profile.price_dobles}
                  priceTrio={profile.price_trio}
                  priceGrupal={profile.price_grupal}
                />
              </div>
            )}
          </section>

          {/* ── Historial de pagos ────────────────────────────────────────── */}
          <section className="mt-8">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Historial de pagos
            </h2>
            {allPayments.length === 0 ? (
              <p className="card mt-3 px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                Aún no registraste pagos.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {allPayments.map((payment) => (
                  <li key={payment.id} className="card px-4 py-3 text-sm">
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>
                      {formatAmount(Number(payment.amount))} · {paymentTypeLabel[payment.type]}
                    </p>
                    <p style={{ color: "var(--muted)" }}>
                      Alumno: {alumnoNameMap.get(payment.alumno_id) ?? "Alumno"}
                    </p>
                    <p style={{ color: "var(--muted)" }}>
                      Método: {methodLabel[payment.method]}
                    </p>
                    <p style={{ color: "var(--muted)" }}>
                      Fecha: {formatUserDate(payment.created_at)}
                    </p>
                    {payment.booking_id ? (
                      <p style={{ color: "var(--muted)" }}>
                        Clase asociada: #{payment.booking_id}
                      </p>
                    ) : null}
                    {payment.note ? (
                      <p style={{ color: "var(--muted)" }}>Nota: {payment.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}





