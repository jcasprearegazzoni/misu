import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUserDate, formatUserDateTime } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { acceptSoloDecisionAction, cancelSoloDecisionAction } from "@/app/dashboard/alumno/decisiones/actions";
import { CancelBookingButton } from "./cancel-booking-button";

type AlumnoTab = "reservar" | "mis-clases" | "decisiones";

type BookingRow = {
  id: number;
  profesor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "individual" | "dobles" | "trio" | "grupal";
  status: "pendiente" | "confirmado" | "cancelado";
  package_consumed: boolean;
};

type ProfesorRow = {
  user_id: string;
  name: string;
  username: string | null;
  cancel_without_charge_hours: number | null;
};

type DecisionRow = {
  id: number;
  booking_id: number;
  status: "pendiente";
  decision_deadline_at: string | null;
  created_at: string;
};

type StudentPackageRow = {
  id: number;
  classes_remaining: number;
  paid: boolean;
  // Supabase puede devolver el join como objeto o array según la versión del cliente.
  package: { name: string; total_classes: number } | { name: string; total_classes: number }[] | null;
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
    .sort((a, b) => a.date.localeCompare(b.date));
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

  const [{ data: profesoresData }, { data: bookingsData }, { data: decisionsData }, { data: studentPackagesData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, name, username, cancel_without_charge_hours")
      .eq("role", "profesor")
      .order("name", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, profesor_id, date, start_time, end_time, type, status, package_consumed")
      .eq("alumno_id", profile.user_id)
      .in("status", ["pendiente", "confirmado"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("booking_solo_decisions")
      .select("id, booking_id, status, decision_deadline_at, created_at")
      .eq("alumno_id", profile.user_id)
      .eq("status", "pendiente")
      .order("decision_deadline_at", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("student_packages")
      .select("id, classes_remaining, paid, package:packages(name, total_classes)")
      .eq("alumno_id", profile.user_id)
      .gt("classes_remaining", 0)
      .order("created_at", { ascending: false }),
  ]);

  const profesores = (profesoresData ?? []) as ProfesorRow[];
  const bookings = (bookingsData ?? []) as BookingRow[];
  const decisions = (decisionsData ?? []) as DecisionRow[];
  const studentPackages = (studentPackagesData ?? []) as StudentPackageRow[];

  const profesorMap = new Map(profesores.map((row) => [row.user_id, row]));
  const bookingsByDate = groupBookingsByDate(bookings);
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const pendingDecisionsCount = decisions.length;
  const now = new Date().getTime();

  const tabs: Array<{ key: AlumnoTab; label: string; badge?: number }> = [
    { key: "reservar", label: "Reservar" },
    { key: "mis-clases", label: "Mis clases" },
    {
      key: "decisiones",
      label: "Decisiones",
      badge: pendingDecisionsCount > 0 ? pendingDecisionsCount : undefined,
    },
  ];

  // El perfil se considera incompleto si el alumno nunca eligió su categoría.
  const perfilCompleto = profile.category !== null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Clases</h1>
      <p className="mt-2 text-sm text-zinc-600">Gestiona todo desde una sola pantalla: reservar, ver y decidir.</p>

      {!perfilCompleto ? (
        <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-semibold text-amber-900">Completá tu perfil</p>
          <p className="mt-1 text-sm text-amber-700">
            Agregá tu categoría y rama para que el profesor pueda conocerte antes de la clase.
          </p>
          <Link
            href="/dashboard/alumno/perfil"
            className="mt-3 inline-flex rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
          >
            Ir a mi perfil
          </Link>
        </section>
      ) : null}

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
                    {profesor.username ? (
                      <Link
                        href={`/p/${profesor.username}`}
                        className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                      >
                        Ver semana
                      </Link>
                    ) : (
                      <span className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-600">
                        Link publico no disponible
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === "mis-clases" ? (
        <section className="mt-6 grid gap-4">
          {studentPackages.length > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Créditos de paquete disponibles</p>
              <ul className="mt-2 grid gap-1">
                {studentPackages.map((pkg) => {
                  const pkgData = Array.isArray(pkg.package) ? pkg.package[0] : pkg.package;
                  const nombre = pkgData?.name ?? "Paquete";
                  const total = pkgData?.total_classes ?? 0;
                  return (
                    <li key={pkg.id} className="flex items-center justify-between text-sm text-emerald-800">
                      <span>{nombre} ({total} clases)</span>
                      <span className="font-semibold">{pkg.classes_remaining} restantes</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
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
                        const isPaid = booking.package_consumed;

                        const computedStatusLabel = isFinalized
                          ? isPaid ? "Finalizada — paquete" : "Finalizada"
                          : statusLabel[booking.status];

                        const computedStatusStyle = isFinalized
                          ? isPaid
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-amber-300 bg-amber-50 text-amber-800"
                          : statusStyles[booking.status];

                        return (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-zinc-900">
                                {booking.start_time.slice(0, 5)} a {booking.end_time.slice(0, 5)}
                              </p>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${computedStatusStyle}`}>
                                {computedStatusLabel}
                              </span>
                            </div>
                            {isFinalized ? (
                              <p className={`mt-1 text-xs font-medium ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                                {isPaid ? "Cubierta por paquete" : "Pendiente de pago — coordiná con tu profesor"}
                              </p>
                            ) : null}
                          </>
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
                            <CancelBookingButton bookingId={booking.id} />
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

                  <p className="mt-2 text-sm text-zinc-600">
                    Quedaste solo/a en esta clase grupal. Podés aceptarla como clase individual o cancelar la reserva.
                  </p>

                  {deadline ? (
                    <p className={isUrgent ? "mt-1 font-medium text-red-700" : "mt-1 text-zinc-700"}>
                      {isUrgent ? "Expira pronto" : "Vence"}: {formatUserDateTime(decision.decision_deadline_at!)}
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
        {pendingDecisionsCount > 0 && activeTab !== "decisiones" ? (
          <Link
            href="/dashboard/alumno/turnos?tab=decisiones"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-red-700 px-4 text-sm font-semibold text-white"
          >
            Ver decisiones ({pendingDecisionsCount})
          </Link>
        ) : activeTab !== "reservar" ? (
          <Link
            href="/dashboard/alumno/turnos?tab=reservar"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white"
          >
            Reservar clase
          </Link>
        ) : (
          <Link
            href="/dashboard/alumno/turnos?tab=mis-clases"
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900"
          >
            Ver mis clases
          </Link>
        )}
      </div>
      <div className="h-16 md:hidden" />
    </main>
  );
}
