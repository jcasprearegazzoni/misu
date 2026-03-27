import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancelBookingAction, confirmBookingAction, createSoloDecisionAction } from "./actions";

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

const typeLabel: Record<BookingRow["type"], string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

export default async function ProfesorBookingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();

  const { data: bookingsData } = await supabase.rpc("get_profesor_pending_bookings", {
    p_profesor_id: profile.user_id,
  });

  const bookings = (bookingsData ?? []) as BookingRow[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Bookings pendientes</h1>
      <p className="mt-2 text-sm text-zinc-600">Vista minima de reservas pendientes recibidas.</p>

      {bookings.length === 0 ? (
        <p className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
          No hay bookings pendientes por el momento.
        </p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm">
              <p className="font-medium text-zinc-900">
                {formatUserDate(booking.date)} - {booking.start_time.slice(0, 5)} a{" "}
                {booking.end_time.slice(0, 5)}
              </p>
              <p className="text-zinc-700">
                Alumno: {booking.alumno_name ?? "Sin nombre"}
              </p>
              <p className="text-zinc-700">Tipo: {typeLabel[booking.type]}</p>
              <div className="mt-3 flex gap-2">
                <form action={confirmBookingAction}>
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <button className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white">
                    Confirmar
                  </button>
                </form>
                <form action={cancelBookingAction}>
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <button className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white">
                    Cancelar
                  </button>
                </form>
                {booking.type === "dobles" || booking.type === "trio" || booking.type === "grupal" ? (
                  <form action={createSoloDecisionAction}>
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <button className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white">
                      Generar decision solo
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
