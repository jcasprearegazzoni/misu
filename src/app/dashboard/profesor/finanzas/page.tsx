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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Finanzas</h1>
      <p className="mt-2 text-sm text-zinc-600">Resumen financiero simple del profesor.</p>

      {hasLoadError ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar los datos financieros. Intenta nuevamente.
        </p>
      ) : null}

      <section className="mt-6">
        <details className="rounded-lg border border-zinc-300 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
            Parametros financieros
          </summary>
          <p className="mt-2 text-sm text-zinc-600">
            Configura precios y costo de cancha. Suele ajustarse ocasionalmente.
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
        </details>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-900">Mes actual y mes anterior</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-300 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Mes actual</p>
            <p className="mt-2 text-xs text-zinc-600">Ingresos brutos</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatAmount(ingresosMesActual)}</p>
            <p className="text-xs text-zinc-600">Ingresos netos</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatAmount(ingresosNetosMesActual)}</p>
          </div>
          <div className="rounded-lg border border-zinc-300 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Mes anterior</p>
            <p className="mt-2 text-xs text-zinc-600">Ingresos brutos</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatAmount(ingresosMesAnterior)}</p>
            <p className="text-xs text-zinc-600">Ingresos netos</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatAmount(ingresosNetosMesAnterior)}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-900">Resumen operativo (mes actual)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2">
            <p className="text-xs text-zinc-600">Pagos registrados</p>
            <p className="mt-1 text-base font-semibold text-zinc-900">{currentPayments.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2">
            <p className="text-xs text-zinc-600">Reservas pendientes de cobro</p>
            <p className="mt-1 text-base font-semibold text-zinc-900">{pendingDebtBookings.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2">
            <p className="text-xs text-zinc-600">Alumnos con deuda</p>
            <p className="mt-1 text-base font-semibold text-zinc-900">{debtSummary.length}</p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-900">Metodos de pago (mes actual)</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-300 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 text-left text-zinc-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Metodo</th>
                <th className="px-4 py-3 font-semibold">Monto total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-200 text-zinc-700">
                <td className="px-4 py-3">Efectivo</td>
                <td className="px-4 py-3">{formatAmount(methodSummary.efectivo)}</td>
              </tr>
              <tr className="border-t border-zinc-200 text-zinc-700">
                <td className="px-4 py-3">Transferencia directa</td>
                <td className="px-4 py-3">{formatAmount(methodSummary.transferencia_directa)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-900">Deudores</h2>
        {debtSummary.length === 0 ? (
          <p className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
            No hay deudores por el momento.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-300 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-100 text-left text-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Alumno</th>
                  <th className="px-4 py-3 font-semibold">Reservas pendientes</th>
                  <th className="px-4 py-3 font-semibold">Monto estimado pendiente</th>
                </tr>
              </thead>
              <tbody>
                {debtSummary.map((item) => (
                  <tr key={item.alumno_id} className="border-t border-zinc-200 text-zinc-700">
                    <td className="px-4 py-3">{item.alumno_name}</td>
                    <td className="px-4 py-3">{item.bookings_count}</td>
                    <td className="px-4 py-3">{formatAmount(item.estimated_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-900">Paquetes</h2>
        <div className="mt-3 rounded-lg border border-zinc-300 bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-600">Paquetes activos</p>
              <p className="text-base font-semibold text-zinc-900">{packagesResumen.activePackages}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-600">Asignados a alumnos</p>
              <p className="text-base font-semibold text-zinc-900">{packagesResumen.assignedStudentPackages}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-600">Paquetes pagados</p>
              <p className="text-base font-semibold text-zinc-900">{packagesResumen.paidStudentPackages}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-600">Con creditos disponibles</p>
              <p className="text-base font-semibold text-zinc-900">{packagesResumen.withCreditsStudentPackages}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}