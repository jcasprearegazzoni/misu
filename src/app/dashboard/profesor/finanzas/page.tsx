import { redirect } from "next/navigation";
import { buildDebtSummaryByStudent, buildPendingDebtBookings } from "@/lib/finanzas/debt-helpers";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PriceSettingsForm } from "./price-settings-form";

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

function getMonthRange(monthOffset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1, 0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function sumPaymentsAmount(payments: PaymentRow[]) {
  return payments.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0);
}

function getTimeDiffHours(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  if (
    Number.isNaN(startTotalMinutes) ||
    Number.isNaN(endTotalMinutes) ||
    endTotalMinutes <= startTotalMinutes
  ) {
    return 0;
  }

  return (endTotalMinutes - startTotalMinutes) / 60;
}

function getEstimatedIncomeByType(
  bookingType: "individual" | "dobles" | "trio" | "grupal",
  prices: {
    price_individual: number | null;
    price_dobles: number | null;
    price_trio: number | null;
    price_grupal: number | null;
  },
) {
  if (bookingType === "individual") {
    return Number(prices.price_individual ?? 0);
  }

  if (bookingType === "dobles") {
    return Number(prices.price_dobles ?? 0);
  }

  if (bookingType === "trio") {
    return Number(prices.price_trio ?? 0);
  }

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
  const courtCostPerHour = Number(profile.court_cost_per_hour ?? 0);
  const courtPercentagePerStudent = Number(profile.court_percentage_per_student ?? 0);
  const totalHours = confirmedBookings.reduce(
    (acc, booking) => acc + getTimeDiffHours(booking.start_time, booking.end_time),
    0,
  );

  if (profile.court_cost_mode === "per_student_percentage") {
    return confirmedBookings.reduce((acc, booking) => {
      const estimatedIncome = getEstimatedIncomeByType(booking.type, {
        price_individual: profile.price_individual,
        price_dobles: profile.price_dobles,
        price_trio: profile.price_trio,
        price_grupal: profile.price_grupal,
      });

      return acc + estimatedIncome * (courtPercentagePerStudent / 100);
    }, 0);
  }

  return totalHours * courtCostPerHour;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function ProfesorFinanzasPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();
  const currentMonth = getMonthRange(0);
  const previousMonth = getMonthRange(-1);

  const [
    currentPaymentsResult,
    previousPaymentsResult,
    bookingsResult,
    coveragePaymentsResult,
    currentMonthConfirmedBookingsResult,
    previousMonthConfirmedBookingsResult,
    alumnoNamesRpcResult,
    activePackagesCountResult,
    assignedStudentPackagesCountResult,
    paidStudentPackagesCountResult,
    studentPackagesWithCreditsCountResult,
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
      .from("packages")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id)
      .eq("active", true),
    supabase
      .from("student_packages")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id),
    supabase
      .from("student_packages")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id)
      .eq("paid", true),
    supabase
      .from("student_packages")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id)
      .gt("classes_remaining", 0),
  ]);

  const hasLoadError = Boolean(
    currentPaymentsResult.error ||
      previousPaymentsResult.error ||
      bookingsResult.error ||
      coveragePaymentsResult.error ||
      currentMonthConfirmedBookingsResult.error ||
      previousMonthConfirmedBookingsResult.error,
  );

  const currentPayments = (currentPaymentsResult.data ?? []) as PaymentRow[];
  const previousPayments = (previousPaymentsResult.data ?? []) as PaymentRow[];
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const coveragePayments = (coveragePaymentsResult.data ?? []) as PaymentRow[];
  const currentMonthConfirmedBookings =
    (currentMonthConfirmedBookingsResult.data ?? []) as MonthConfirmedBookingRow[];
  const previousMonthConfirmedBookings =
    (previousMonthConfirmedBookingsResult.data ?? []) as MonthConfirmedBookingRow[];
  const alumnoNameRows = (alumnoNamesRpcResult.data ?? []) as AlumnoNameRow[];

  const coveredBookingIds = new Set(
    coveragePayments
      .map((payment) => payment.booking_id)
      .filter((bookingId): bookingId is number => typeof bookingId === "number"),
  );

  const alumnoNameMap = new Map<string, string>();
  for (const row of alumnoNameRows) {
    if (!alumnoNameMap.has(row.alumno_id)) {
      alumnoNameMap.set(row.alumno_id, row.alumno_name?.trim() || "Alumno");
    }
  }

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

  const ingresosMesActual = sumPaymentsAmount(currentPayments);
  const ingresosMesAnterior = sumPaymentsAmount(previousPayments);
  const costoCanchaMesActual = getEstimatedCourtCost(currentMonthConfirmedBookings, profile);
  const costoCanchaMesAnterior = getEstimatedCourtCost(previousMonthConfirmedBookings, profile);
  const ingresosNetosMesActual = ingresosMesActual - costoCanchaMesActual;
  const ingresosNetosMesAnterior = ingresosMesAnterior - costoCanchaMesAnterior;

  const methodSummary = {
    efectivo: sumPaymentsAmount(currentPayments.filter((payment) => payment.method === "efectivo")),
    transferencia_directa: sumPaymentsAmount(
      currentPayments.filter((payment) => payment.method === "transferencia_directa"),
    ),
  };

  const packagesResumen = {
    activePackages: activePackagesCountResult.count ?? 0,
    assignedStudentPackages: assignedStudentPackagesCountResult.count ?? 0,
    paidStudentPackages: paidStudentPackagesCountResult.count ?? 0,
    withCreditsStudentPackages: studentPackagesWithCreditsCountResult.count ?? 0,
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight sm:text-3xl"
          style={{ color: "var(--foreground)" }}
        >
          Finanzas
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Resumen financiero de tu actividad como profesor.
        </p>
      </div>

      {hasLoadError ? (
        <div className="alert-error mt-6">
          No se pudieron cargar los datos financieros. Intentá nuevamente.
        </div>
      ) : null}

      {/* Parámetros financieros */}
      <section className="mt-6">
        <details
          className="card overflow-hidden"
          style={{ borderRadius: "14px" }}
        >
          <summary
            className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            <span>⚙️ Parámetros financieros</span>
            <span style={{ color: "var(--muted)", fontSize: "18px" }}>›</span>
          </summary>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "1.25rem",
              background: "var(--surface-2)",
            }}
          >
            <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
              Configurá precios y costo de cancha. Suele ajustarse ocasionalmente.
            </p>
            <PriceSettingsForm
              initialValues={{
                price_individual: profile.price_individual === null ? "" : String(profile.price_individual),
                price_dobles: profile.price_dobles === null ? "" : String(profile.price_dobles),
                price_trio: profile.price_trio === null ? "" : String(profile.price_trio),
                price_grupal: profile.price_grupal === null ? "" : String(profile.price_grupal),
                court_cost_mode: profile.court_cost_mode,
                court_cost_per_hour:
                  profile.court_cost_per_hour === null ? "" : String(profile.court_cost_per_hour),
                court_percentage_per_student:
                  profile.court_percentage_per_student === null
                    ? ""
                    : String(profile.court_percentage_per_student),
              }}
            />
          </div>
        </details>
      </section>

      {/* Mes actual y anterior */}
      <section className="mt-6">
        <h2
          className="mb-3 text-base font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Resumen mensual
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Mes actual */}
          <div
            className="card p-5"
            style={{ borderColor: "var(--border-misu)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--misu)" }}>
                Mes actual
              </p>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--misu)",
                  display: "block",
                  animation: "pulse-misu 2s infinite",
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Ingresos brutos</p>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--foreground)" }}>
                  {formatAmount(ingresosMesActual)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Ingresos netos</p>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--success)" }}>
                  {formatAmount(ingresosNetosMesActual)}
                </p>
              </div>
            </div>
          </div>

          {/* Mes anterior */}
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Mes anterior
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Ingresos brutos</p>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--foreground)" }}>
                  {formatAmount(ingresosMesAnterior)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Ingresos netos</p>
                <p className="mt-1 text-xl font-black" style={{ color: "var(--foreground)" }}>
                  {formatAmount(ingresosNetosMesAnterior)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen operativo */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--foreground)" }}>
          Resumen operativo (mes actual)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Pagos registrados", value: currentPayments.length },
            { label: "Reservas pendientes de cobro", value: pendingDebtBookings.length },
            { label: "Alumnos con deuda", value: debtSummary.length },
          ].map((item) => (
            <div
              key={item.label}
              className="card flex items-center justify-between gap-3 px-4 py-4"
            >
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {item.label}
              </p>
              <p
                className="text-2xl font-black"
                style={{ color: item.value > 0 && item.label === "Alumnos con deuda" ? "var(--warning)" : "var(--foreground)" }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Métodos de pago */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--foreground)" }}>
          Métodos de pago (mes actual)
        </h2>
        <div className="card overflow-hidden">
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
                <td className="font-semibold">{formatAmount(methodSummary.transferencia_directa)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Deudores */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--foreground)" }}>
          Deudores
        </h2>
        {debtSummary.length === 0 ? (
          <div
            className="card px-4 py-4 text-sm"
            style={{ color: "var(--muted)", textAlign: "center" }}
          >
            ✓ Sin deudores por el momento
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Reservas pendientes</th>
                  <th>Monto estimado</th>
                </tr>
              </thead>
              <tbody>
                {debtSummary.map((item) => (
                  <tr key={item.alumno_id}>
                    <td className="font-medium">{item.alumno_name}</td>
                    <td>{item.bookings_count}</td>
                    <td
                      className="font-semibold"
                      style={{ color: "var(--warning)" }}
                    >
                      {formatAmount(item.estimated_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Paquetes */}
      <section className="mt-6 mb-8">
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--foreground)" }}>
          Paquetes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Paquetes activos", value: packagesResumen.activePackages },
            { label: "Asignados a alumnos", value: packagesResumen.assignedStudentPackages },
            { label: "Paquetes pagados", value: packagesResumen.paidStudentPackages },
            { label: "Con créditos disponibles", value: packagesResumen.withCreditsStudentPackages },
          ].map((item) => (
            <div
              key={item.label}
              className="card flex items-center justify-between gap-3 px-4 py-3"
            >
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {item.label}
              </p>
              <p className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}