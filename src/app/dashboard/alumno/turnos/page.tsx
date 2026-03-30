import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { acceptSoloDecisionAction, cancelSoloDecisionAction } from "@/app/dashboard/alumno/decisiones/actions";
import { cancelAlumnoBookingAction } from "./actions";

type AlumnoTab = "reservar" | "mis-clases" | "decisiones";

type BookingRow = {
  id: number;
  profesor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
};

type ProfesorRow = {
  user_id: string;
  name: string;
  cancel_without_charge_hours: number | null;
};

type DecisionRow = {
  id: number;
  booking_id: number;
  status: "pendiente";
  decision_deadline_at: string | null;
  created_at: string;
};

const statusLabel: Record<BookingRow["status"], string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  cancelado: "Cancelada",
};

const typeLabel: Record<BookingRow["type"], string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

const statusStyles: Record<BookingRow["status"], string> = {
  pendiente: "border-amber-300 bg-amber-50 text-amber-800",
  confirmado: "border-emerald-300 bg-emerald-50 text-emerald-800",
  cancelado: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

const URGENT_WINDOW_MS = 6 * 60 * 60 * 1000;

function parseTab(value?: string): AlumnoTab {
  if (value === "reservar" || value === "mis-clases" || value === "decisiones") {
    return value;
  }
  return "reservar";
}

function isFinalizedBooking(booking: BookingRow) {
  if (booking.status === "cancelado") {
    return false;
  }
  const endDateTime = new Date(`${booking.date}T${booking.end_time.slice(0, 8)}-03:00`);
  return endDateTime.getTime() < Date.now();
}

function groupBookingsByDate(bookings: BookingRow[]) {
  const groupsMap = new Map<string, BookingRow[]>();

  for (const booking of bookings) {
    if (!groupsMap.has(booking.date)) {
      groupsMap.set(booking.date, []);
    }
    groupsMap.get(booking.date)?.push(booking);
  }

  return Array.from(groupsMap.entries())
    .map(([date, dayBookings]) => ({
      date,
      label: formatUserDate(date),
      bookings: dayBookings.sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

type AlumnoTurnosPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AlumnoTurnosPage({ searchParams }: AlumnoTurnosPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "alumno") {
    redirect("/dashboard/profesor/turnos");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = parseTab(resolvedSearchParams?.tab);

  const supabase = await createSupabaseServerClient();

  const [{ data: profesoresData }, { data: bookingsData }, { data: decisionsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, name, cancel_without_charge_hours")
      .eq("role", "profesor")
      .order("name", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, profesor_id, date, start_time, end_time, type, status")
      .eq("alumno_id", profile.user_id)
      .in("status", ["pendiente", "confirmado"])
      .order("date", { ascending: false })
      .order("start_time", { ascending: true }),
    supabase
      .from("booking_solo_decisions")
      .select("id, booking_id, status, decision_deadline_at, created_at")
      .eq("alumno_id", profile.user_id)
      .eq("status", "pendiente")
      .order("decision_deadline_at", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const profesores = (profesoresData ?? []) as ProfesorRow[];
  const bookings = (bookingsData ?? []) as BookingRow[];
  const decisions = (decisionsData ?? []) as DecisionRow[];

  const profesorMap = new Map(profesores.map((row) => [row.user_id, row]));
  const bookingsByDate = groupBookingsByDate(bookings);
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const pendingDecisionsCount = decisions.length;
  const now = new Date().getTime();

  const tabs: Array<{ key: AlumnoTab; label: string; badge?: number }> = [
    { key: "reservar", label: "Reservar" },
    { key: "mis-clases", label: "Mis clases", badge: bookings.length > 0 ? bookings.length : undefined },
    {
      key: "decisiones",
      label: "Decisiones",
      badge: pendingDecisionsCount > 0 ? pendingDecisionsCount : undefined,
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Clases</h1>
      <p className="mt-2 text-sm text-zinc-600">Gestiona todo desde una sola pantalla: reservar, ver y decidir.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={`/dashboard/alumno/turnos?tab=${tab.key}`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${
                isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-800"
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive ? "bg-white text-zinc-900" : "bg-red-600 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {activeTab === "reservar" ? (
        <section className="mt-6 rounded-xl border border-zinc-300 bg-white p-4">
          <p className="text-base font-semibold text-zinc-900">Elegir profesor</p>
          <p className="mt-1 text-sm text-zinc-600">Selecciona un profesor para ver su semana y reservar clase.</p>

          {profesores.length === 0 ? (
            <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              No hay profesores cargados por el momento.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {profesores.map((profesor) => (
                <li key={profesor.user_id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900">{profesor.name}</p>
                    <Link
                      href={`/alumno/profesores/${profesor.user_id}/slots`}
                      className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                    >
                      Ver semana
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === "mis-clases" ? (
        <section className="mt-6 grid gap-4">
          {bookingsByDate.length === 0 ? (
            <p className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
              Aun no tienes clases reservadas.
            </p>
          ) : (
            bookingsByDate.map((group) => (
              <section key={group.date} className="rounded-xl border border-zinc-300 bg-white">
                <header className="border-b border-zinc-200 px-4 py-3">
                  <h2 className="text-sm font-semibold text-zinc-900">{group.label}</h2>
                </header>
                <ul className="grid gap-3 p-3">
                  {group.bookings.map((booking) => (
                    <li key={booking.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                      {(() => {
                        const isFinalized = isFinalizedBooking(booking);
                        const computedStatusLabel = isFinalized ? "Finalizada" : statusLabel[booking.status];
                        const computedStatusStyle = isFinalized
                          ? "border-sky-300 bg-sky-50 text-sky-800"
                          : statusStyles[booking.status];

                        return (
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-zinc-900">
                          {booking.start_time.slice(0, 5)} a {booking.end_time.slice(0, 5)}
                        </p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${computedStatusStyle}`}>
                          {computedStatusLabel}
                        </span>
                      </div>
                        );
                      })()}
                      <p className="mt-2 text-zinc-700">
                        Profesor: {profesorMap.get(booking.profesor_id)?.name ?? "Profesor"}
                      </p>
                      <p className="text-zinc-700">Tipo: {typeLabel[booking.type]}</p>
                      {(() => {
                        const profesor = profesorMap.get(booking.profesor_id);
                        const cancelWindowHours = Number(profesor?.cancel_without_charge_hours ?? 0);
                        const bookingStart = new Date(`${booking.date}T${booking.start_time.slice(0, 8)}-03:00`);
                        const nowDate = new Date();
                        const minCancelDate = new Date(
                          bookingStart.getTime() - cancelWindowHours * 60 * 60 * 1000,
                        );
                        const canCancelByWindow = cancelWindowHours <= 0 || nowDate <= minCancelDate;
                        const canCancelStatus = booking.status === "pendiente" || booking.status === "confirmado";

                        if (!canCancelStatus) {
                          return null;
                        }

                        if (!canCancelByWindow) {
                          return (
                            <p className="mt-2 text-xs text-zinc-600">
                              Ya paso el plazo de cancelacion definido por el profesor.
                            </p>
                          );
                        }

                        return (
                          <div className="mt-2">
                            <form action={cancelAlumnoBookingAction}>
                              <input type="hidden" name="booking_id" value={booking.id} />
                              <button
                                type="submit"
                                className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                              >
                                Cancelar clase
                              </button>
                            </form>
                          </div>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </section>
      ) : null}

      {activeTab === "decisiones" ? (
        <section className="mt-6 grid gap-2">
          {decisions.length === 0 ? (
            <p className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
              No tienes decisiones pendientes.
            </p>
          ) : (
            decisions.map((decision) => {
              const booking = bookingMap.get(decision.booking_id);

              if (!booking) {
                return (
                  <div key={decision.id} className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm">
                    <p className="text-zinc-700">Reserva no disponible.</p>
                  </div>
                );
              }

              const deadline = decision.decision_deadline_at ? new Date(decision.decision_deadline_at) : null;
              const isUrgent = deadline ? deadline.getTime() - now < URGENT_WINDOW_MS : false;

              return (
                <article
                  key={decision.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    isUrgent ? "border-red-300 bg-red-50" : "border-zinc-300 bg-white"
                  }`}
                >
                  <p className="font-semibold text-zinc-900">
                    {formatUserDate(booking.date)} - {booking.start_time.slice(0, 5)} a{" "}
                    {booking.end_time.slice(0, 5)}
                  </p>
                  <p className="mt-1 text-zinc-700">
                    Profesor: {profesorMap.get(booking.profesor_id)?.name ?? "No disponible"}
                  </p>
                  <p className="text-zinc-700">Tipo actual: {typeLabel[booking.type]}</p>

                  {deadline ? (
                    <p className={isUrgent ? "mt-1 font-medium text-red-700" : "mt-1 text-zinc-700"}>
                      {isUrgent ? "Expira pronto" : "Vence"}: {formatUserDate(decision.decision_deadline_at!)}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={acceptSoloDecisionAction}>
                      <input type="hidden" name="decision_id" value={decision.id} />
                      <button className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white">
                        Aceptar individual
                      </button>
                    </form>

                    <form action={cancelSoloDecisionAction}>
                      <input type="hidden" name="decision_id" value={decision.id} />
                      <button className="rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white">
                        Cancelar reserva
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <Link
          href="/dashboard/alumno/turnos?tab=reservar"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white"
        >
          Reservar clase
        </Link>
      </div>
      <div className="h-16 md:hidden" />
    </main>
  );
}

