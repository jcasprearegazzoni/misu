import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { buildDebtSummaryByStudent, buildPendingDebtBookings } from "@/lib/finanzas/debt-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DebtChargeForm } from "./debt-charge-form";

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

type PaymentCoverageRow = {
  booking_id: number;
  type: "clase" | "paquete" | "seña" | "diferencia_cobro" | "reembolso";
};

type AlumnoNameRow = {
  alumno_id: string;
  alumno_name: string | null;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function ProfesorDeudasPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();
  const [bookingsResult, paymentsResult, alumnoNamesRpcResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, alumno_id, date, start_time, end_time, type, status, package_consumed")
      .eq("profesor_id", profile.user_id)
      .eq("status", "confirmado"),
    supabase
      .from("payments")
      .select("booking_id, type")
      .eq("profesor_id", profile.user_id)
      .not("booking_id", "is", null)
      .in("type", ["clase", "seña", "diferencia_cobro"]),
    supabase.rpc("get_profesor_bookings_with_alumno_name", {
      p_profesor_id: profile.user_id,
    }),
  ]);

  const hasLoadError = Boolean(bookingsResult.error || paymentsResult.error);
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const paymentCoverageRows = (paymentsResult.data ?? []) as PaymentCoverageRow[];
  const alumnoNameRows = (alumnoNamesRpcResult.data ?? []) as AlumnoNameRow[];

  // Set de booking_id cubiertos por payments asociados validos.
  const coveredBookingIds = new Set(
    paymentCoverageRows
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Deudas</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Vista unificada de pendientes de cobro por alumno y por reserva.
      </p>

      {hasLoadError ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar los datos de deudas. Intenta nuevamente.
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-zinc-900">Resumen por alumno</h2>
            {debtSummary.length === 0 ? (
              <p className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
                No hay saldo pendiente por el momento.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-300 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-100 text-left text-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Alumno</th>
                      <th className="px-4 py-3 font-semibold">Bookings pendientes</th>
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

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900">Detalle (solo pendientes)</h2>
            {pendingDebtBookings.length === 0 ? (
              <p className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
                No hay bookings pendientes de cobro.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-300 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-100 text-left text-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Horario</th>
                      <th className="px-4 py-3 font-semibold">Alumno</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Cobertura paquete</th>
                      <th className="px-4 py-3 font-semibold">Payment asociado</th>
                      <th className="px-4 py-3 font-semibold">Estado financiero</th>
                      <th className="px-4 py-3 font-semibold">Monto estimado</th>
                      <th className="px-4 py-3 font-semibold">Cobro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDebtBookings.map((booking) => (
                      <tr key={booking.id} className="border-t border-zinc-200 text-zinc-700">
                        <td className="px-4 py-3">{formatUserDate(booking.date)}</td>
                        <td className="px-4 py-3">
                          {booking.start_time.slice(0, 5)} a {booking.end_time.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3">{booking.alumno_name}</td>
                        <td className="px-4 py-3">{booking.type}</td>
                        <td className="px-4 py-3">{booking.package_consumed ? "Si" : "No"}</td>
                        <td className="px-4 py-3">{booking.has_payment_coverage ? "Si" : "No"}</td>
                        <td className="px-4 py-3">{booking.financial_status}</td>
                        <td className="px-4 py-3">{formatAmount(booking.estimated_amount)}</td>
                        <td className="px-4 py-3">
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
          </section>
        </>
      )}
    </main>
  );
}
