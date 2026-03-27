import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PaymentForm } from "./payment-form";

type BookingRow = {
  id: number;
  alumno_id: string;
  alumno_name: string | null;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
  created_at: string;
};

type PaymentRow = {
  id: number;
  alumno_id: string;
  booking_id: number | null;
  amount: number;
  method: "efectivo" | "transferencia_directa";
  type: "clase" | "paquete" | "se\u00f1a" | "diferencia_cobro" | "reembolso";
  note: string | null;
  created_at: string;
};

const methodLabel: Record<PaymentRow["method"], string> = {
  efectivo: "Efectivo",
  transferencia_directa: "Transferencia directa",
};

const typeLabel: Record<PaymentRow["type"], string> = {
  clase: "Clase",
  paquete: "Paquete",
  ["se\u00f1a"]: "Sena",
  diferencia_cobro: "Diferencia de cobro",
  reembolso: "Reembolso",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ProfesorPagosPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();
  const [bookingsResult, paymentsResult] = await Promise.all([
    supabase.rpc("get_profesor_bookings_with_alumno_name", {
      p_profesor_id: profile.user_id,
    }),
    supabase
      .from("payments")
      .select("id, alumno_id, booking_id, amount, method, type, note, created_at")
      .eq("profesor_id", profile.user_id)
      .order("created_at", { ascending: false }),
  ]);

  const hasLoadError = Boolean(bookingsResult.error || paymentsResult.error);
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];

  const coveredBookingIds = new Set(
    payments
      .filter(
        (payment) =>
          payment.booking_id !== null &&
          (payment.type === "clase" || payment.type === "seña" || payment.type === "diferencia_cobro"),
      )
      .map((payment) => payment.booking_id as number),
  );

  const alumnos = Array.from(
    new Map(
      bookings.map((booking) => [
        booking.alumno_id,
        {
          user_id: booking.alumno_id,
          label: booking.alumno_name?.trim() || "Alumno",
        },
      ]),
    ).values(),
  );

  const alumnoNameMap = new Map(alumnos.map((alumno) => [alumno.user_id, alumno.label]));
  const bookingOptions = bookings
    .filter((booking) => !coveredBookingIds.has(booking.id))
    .map((booking) => ({
      id: booking.id,
      alumno_id: booking.alumno_id,
      alumno_name: booking.alumno_name?.trim() || "Alumno",
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      type: booking.type,
    }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Pagos</h1>
      <p className="mt-2 text-sm text-zinc-600">Registro manual de cobros y listado historico simple.</p>

      {hasLoadError ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar los datos de pagos. Aplica la migracion 020 y recarga la pagina.
        </p>
      ) : null}

      {!hasLoadError && alumnos.length === 0 ? (
        <p className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
          No hay bookings de alumnos para seleccionar. Primero confirma o crea una reserva.
        </p>
      ) : null}

      {!hasLoadError && alumnos.length > 0 ? (
        <PaymentForm
          alumnos={alumnos}
          bookings={bookingOptions}
          priceIndividual={profile.price_individual}
          priceDobles={profile.price_dobles}
          priceTrio={profile.price_trio}
          priceGrupal={profile.price_grupal}
        />
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Historial de pagos</h2>
        {payments.length === 0 ? (
          <p className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
            Aun no registraste pagos.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {payments.map((payment) => (
              <li key={payment.id} className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm">
                <p className="font-medium text-zinc-900">
                  {formatAmount(Number(payment.amount))} - {typeLabel[payment.type]}
                </p>
                <p className="text-zinc-700">
                  Alumno: {alumnoNameMap.get(payment.alumno_id) ?? "Alumno"}
                </p>
                <p className="text-zinc-700">Metodo: {methodLabel[payment.method]}</p>
                <p className="text-zinc-700">Fecha: {formatUserDate(payment.created_at)}</p>
                {payment.booking_id ? (
                  <p className="text-zinc-700">Booking asociado: #{payment.booking_id}</p>
                ) : null}
                {payment.note ? <p className="text-zinc-700">Nota: {payment.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
