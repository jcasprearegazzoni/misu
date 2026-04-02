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
  type: "clase" | "paquete" | "seña" | "diferencia_cobro" | "reembolso";
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
  ["seña"]: "Seña",
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
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Pagos
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Registro manual de cobros e historial de pagos.
        </p>
      </header>

      {hasLoadError ? <p className="alert-error mt-6">No se pudieron cargar los datos de pagos. Intentá nuevamente.</p> : null}

      {!hasLoadError && alumnos.length === 0 ? (
        <p className="card mt-6 px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
          No hay clases de alumnos para seleccionar. Primero confirmá o creá una reserva.
        </p>
      ) : null}

      {!hasLoadError && alumnos.length > 0 ? (
        <section className="card mt-6 p-4">
          <PaymentForm
            alumnos={alumnos}
            bookings={bookingOptions}
            priceIndividual={profile.price_individual}
            priceDobles={profile.price_dobles}
            priceTrio={profile.price_trio}
            priceGrupal={profile.price_grupal}
          />
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Historial de pagos
        </h2>
        {payments.length === 0 ? (
          <p className="card mt-3 px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
            Aún no registraste pagos.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {payments.map((payment) => (
              <li key={payment.id} className="card px-4 py-3 text-sm">
                <p className="font-medium" style={{ color: "var(--foreground)" }}>
                  {formatAmount(Number(payment.amount))} · {typeLabel[payment.type]}
                </p>
                <p style={{ color: "var(--muted)" }}>Alumno: {alumnoNameMap.get(payment.alumno_id) ?? "Alumno"}</p>
                <p style={{ color: "var(--muted)" }}>Método: {methodLabel[payment.method]}</p>
                <p style={{ color: "var(--muted)" }}>Fecha: {formatUserDate(payment.created_at)}</p>
                {payment.booking_id ? <p style={{ color: "var(--muted)" }}>Clase asociada: #{payment.booking_id}</p> : null}
                {payment.note ? <p style={{ color: "var(--muted)" }}>Nota: {payment.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
